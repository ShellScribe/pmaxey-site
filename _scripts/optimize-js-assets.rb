#!/usr/bin/env ruby
# frozen_string_literal: true

require "digest"
require "fileutils"
require "open3"
require "pathname"

site_root = ARGV.fetch(0) do
  warn "Usage: ruby _scripts/optimize-js-assets.rb ./_site"
  exit 1
end

site_root = File.expand_path(site_root)
js_dir = File.join(site_root, "assets", "js")
project_root = File.expand_path("..", __dir__)
terser_bin = ENV.fetch("TERSER_BIN", File.join(project_root, "node_modules", ".bin", "terser"))

unless Dir.exist?(js_dir)
  warn "JavaScript asset directory not found: #{js_dir}"
  exit 1
end

unless File.executable?(terser_bin)
  warn "Terser executable not found: #{terser_bin}"
  warn "Run npm ci before optimizing JavaScript assets."
  exit 1
end

js_files = Dir.children(js_dir)
              .select { |entry| File.file?(File.join(js_dir, entry)) && File.extname(entry) == ".js" }
              .sort
              .map { |entry| File.join(js_dir, entry) }

if js_files.empty?
  puts "No JavaScript assets found in #{js_dir}."
  exit 0
end

optimized_assets = js_files.map do |source_path|
  minified, error_output, status = Open3.capture3(
    terser_bin,
    source_path,
    "--compress",
    "--mangle",
    "--comments",
    "false"
  )

  unless status.success?
    warn "Terser failed for #{source_path}:"
    warn error_output
    exit status.exitstatus || 1
  end

  minified = "#{minified.strip}\n"
  digest = Digest::SHA256.hexdigest(minified)[0, 12]
  target_name = "#{digest}.js"

  {
    old_path: source_path,
    old_ref: "assets/js/#{File.basename(source_path)}",
    target_path: File.join(js_dir, target_name),
    target_ref: "assets/js/#{target_name}",
    contents: minified
  }
end

optimized_assets.each do |asset|
  File.write(asset[:target_path], asset[:contents])
end

optimized_assets.each do |asset|
  FileUtils.rm_f(asset[:old_path]) unless asset[:old_path] == asset[:target_path]
end

rewrite_extensions = %w[.html .xml .txt .json .webmanifest]
rewritten_files = 0

Pathname(site_root).find do |path|
  next unless path.file?
  next unless rewrite_extensions.include?(path.extname)

  original = path.read
  rewritten = optimized_assets.reduce(original) do |content, asset|
    content.gsub(asset[:old_ref], asset[:target_ref])
  end

  next if rewritten == original

  path.write(rewritten)
  rewritten_files += 1
end

optimized_assets.each do |asset|
  puts "#{asset[:old_ref]} -> #{asset[:target_ref]}"
end
puts "Rewrote JavaScript references in #{rewritten_files} generated file(s)."

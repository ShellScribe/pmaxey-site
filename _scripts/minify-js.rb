#!/usr/bin/env ruby
# frozen_string_literal: true

path = ARGV.fetch(0)
source = File.read(path)

renames = {
  "consoleDetails" => "a",
  "panel" => "b",
  "form" => "c",
  "input" => "d",
  "output" => "e",
  "visibleCommand" => "f",
  "closeButton" => "g",
  "minimizeButton" => "h",
  "maximizeButton" => "i",
  "summary" => "j",
  "reduceMotion" => "k",
  "promptText" => "l",
  "catImage" => "m",
  "minimizeTimer" => "n",
  "commands" => "o",
  "normalizeCommand" => "p",
  "clearHint" => "q",
  "appendLine" => "r",
  "appendImage" => "s",
  "scrollOutput" => "t",
  "syncVisibleCommand" => "u",
  "focusInput" => "v",
  "focusSummary" => "w",
  "setMaximized" => "x",
  "setMinimized" => "y",
  "clearMinimizing" => "z",
  "closeConsole" => "aa",
  "finishMinimize" => "ab",
  "minimizeConsole" => "ac",
  "isMaximized" => "ad",
  "isMinimized" => "ae",
  "command" => "af",
  "figure" => "ag",
  "image" => "ah",
  "line" => "ai",
  "prompt" => "aj",
  "event" => "ak",
  "text" => "al"
}

def identifier_char?(char)
  char&.match?(/[A-Za-z0-9_$]/)
end

def identifier_start?(char)
  char&.match?(/[A-Za-z_$]/)
end

def transform_identifiers(source, renames)
  output = +""
  index = 0
  quote = nil
  escape = false

  while index < source.length
    char = source[index]
    nxt = source[index + 1]

    if quote
      output << char
      if escape
        escape = false
      elsif char == "\\"
        escape = true
      elsif char == quote
        quote = nil
      end
      index += 1
      next
    end

    if char == "\"" || char == "'" || char == "`"
      quote = char
      output << char
      index += 1
      next
    end

    if char == "/" && nxt == "/"
      index += 2
      index += 1 while index < source.length && source[index] != "\n"
      next
    end

    if char == "/" && nxt == "*"
      index += 2
      index += 1 while index < source.length - 1 && !(source[index] == "*" && source[index + 1] == "/")
      index += 2
      next
    end

    if identifier_start?(char)
      start = index
      index += 1
      index += 1 while index < source.length && identifier_char?(source[index])
      token = source[start...index]
      previous = output.rstrip[-1]
      output << (previous == "." ? token : renames.fetch(token, token))
      next
    end

    output << char
    index += 1
  end

  output
end

def minify(source)
  output = +""
  index = 0
  quote = nil
  escape = false
  pending_space = false

  while index < source.length
    char = source[index]

    if quote
      output << char
      if escape
        escape = false
      elsif char == "\\"
        escape = true
      elsif char == quote
        quote = nil
      end
      index += 1
      next
    end

    if char == "\"" || char == "'" || char == "`"
      output << " " if pending_space && identifier_char?(output[-1]) && identifier_char?(char)
      pending_space = false
      quote = char
      output << char
      index += 1
      next
    end

    if char.match?(/\s/)
      pending_space = true
      index += 1
      next
    end

    output << " " if pending_space && identifier_char?(output[-1]) && identifier_char?(char)
    pending_space = false

    output << char unless char == ";" && source[index + 1]&.match?(/\s*}/)
    index += 1
  end

  output.strip
end

minified = minify(transform_identifiers(source, renames))
File.write(path, "#{minified}\n")

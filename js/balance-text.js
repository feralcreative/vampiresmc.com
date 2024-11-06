/**
 * @note DO NOT EDIT ANY PART OF THIS SCRIPT WITHOUT EXPLICIT PERMISSION FROM THE USER.
 * The script is fully functional and has been approved to run as intended.
 * Only add requested changes or enhancements.
 *
 * This script dynamically balances text within specified elements, adjusting line breaks and spacing
 * to improve visual alignment. It works by analyzing the text and applying styles to ensure that
 * text does not overflow its container while maintaining justification where applicable.
 *
 * Steps performed by this function:
 * 1. Initializes necessary variables and handlers for text balancing.
 * 2. Listens for events such as window resizing to recalculate text balance.
 * 3. Applies text balancing logic to specified elements, handling white space and line breaks.
 *
 * Created by: Ziad Ezzat <ziad@feralcreative.co>
 * Original code: https://github.com/feralcreative/
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory); // AMD support
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory(); // Node.js support
  } else {
    root.balanceText = factory(); // Global variable assignment
  }
})(this, () => {
  let breakMatches, wsnwMatches, wsnwOffset; // To track break positions and offsets
  const watching = { sel: [], el: [] }; // Elements being watched for text balancing
  let handlersInitialized = false; // Flag to prevent multiple handler initializations
  let polyfilled = false; // Flag to indicate if polyfill has been applied

  const noop = () => {}; // No operation function placeholder

  const forEach = (elements, callback) => {
    Array.prototype.forEach.call(elements, callback); // Polyfilled forEach for NodeLists
  };

  const ready = (fn) => {
    // Executes a function when the DOM is ready
    if (document.readyState !== "loading") {
      fn();
    } else if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      document.attachEvent("onreadystatechange", () => {
        if (document.readyState !== "loading") {
          fn();
        }
      });
    }
  };

  const debounce = (func, threshold = 100, execAsap = false, ...args) => {
    // Debounce function to limit execution
    let timeout;
    return function () {
      const obj = this;
      const delayed = () => {
        if (!execAsap) {
          func.apply(obj, args);
        }
        timeout = null; // Reset timeout
      };
      if (timeout) {
        clearTimeout(timeout); // Clear existing timeout
      } else if (execAsap) {
        func.apply(obj, args); // Execute immediately if specified
      }
      timeout = setTimeout(delayed, threshold); // Set a new timeout
    };
  };

  const hasTextWrap = () => {
    // Checks if the browser supports text wrapping
    if (typeof window === "undefined") {
      return false; // Return false in non-browser environments
    }
    const { style } = document.documentElement; // Access root style
    return style.textWrap || style.WebkitTextWrap || style.MozTextWrap || style.MsTextWrap; // Support for various prefixes
  };

  function NextWS_params() {
    this.reset(); // Initialize the index and width
  }

  NextWS_params.prototype.reset = function () {
    this.index = 0; // Reset index
    this.width = 0; // Reset width
  };

  const isWhiteSpaceNoWrap = (index) => wsnwMatches.some((range) => range.start < index && index < range.end); // Check if whitespace is nowrap

  const recursiveCalcNoWrapOffsetsForLine = (el, includeTag) => {
    if (el.nodeType === el.ELEMENT_NODE) {
      const style = window.getComputedStyle(el);
      if (style.whiteSpace === "nowrap") {
        const len = el.outerHTML.length;
        wsnwMatches.push({ start: wsnwOffset, end: wsnwOffset + len });
        wsnwOffset += len; // Update offset
      } else {
        forEach(el.childNodes, (child) => {
          recursiveCalcNoWrapOffsetsForLine(child, true);
        });
        if (includeTag) {
          wsnwOffset += el.outerHTML.length - el.innerHTML.length; // Update offset for tags
        }
      }
    } else if (el.nodeType === el.COMMENT_NODE) {
      wsnwOffset += el.length + 7; // Account for comment nodes
    } else if (el.nodeType === el.PROCESSING_INSTRUCTION_NODE) {
      wsnwOffset += el.length + 2; // Account for processing instructions
    } else {
      wsnwOffset += el.length; // Regular text node
    }
  };

  const calcNoWrapOffsetsForLine = (el, oldWS, lineCharOffset) => {
    if (lineCharOffset === 0) {
      el.style.whiteSpace = oldWS; // Restore old white-space style
      wsnwOffset = 0; // Reset offset
      wsnwMatches = []; // Reset matches
      recursiveCalcNoWrapOffsetsForLine(el, false); // Calculate no-wrap offsets
      el.style.whiteSpace = "nowrap"; // Set to nowrap for further processing
    } else {
      const newMatches = wsnwMatches
        .filter((match) => match.start > lineCharOffset)
        .map((match) => ({
          start: match.start - lineCharOffset,
          end: match.end - lineCharOffset,
        }));
      wsnwMatches = newMatches; // Update matches
    }
  };

  const removeTags = (el) => {
    // Clean up specific tags in the element
    const brs = el.querySelectorAll('br[data-owner="balance-text-hyphen"]');
    forEach(brs, (br) => {
      br.outerHTML = ""; // Remove specific line break tags
    });
    const brs2 = el.querySelectorAll('br[data-owner="balance-text"]');
    forEach(brs2, (br) => {
      br.outerHTML = " "; // Replace with space
    });
    const spans = el.querySelectorAll('span[data-owner="balance-text-softhyphen"]');
    if (spans.length > 0) {
      forEach(spans, (span) => {
        const textNode = document.createTextNode("­");
        span.parentNode.insertBefore(textNode, span); // Insert soft hyphen
        span.parentNode.removeChild(span); // Remove span
      });
    }
    const justifiedSpans = el.querySelectorAll('span[data-owner="balance-text-justify"]');
    if (justifiedSpans.length > 0) {
      let txt = "";
      forEach(justifiedSpans, (span) => {
        txt += span.textContent; // Concatenate text
        span.parentNode.removeChild(span); // Remove span
      });
      el.innerHTML = txt; // Set innerHTML to concatenated text
    }
  };

  const isJustified = (el) => {
    const style = el.currentStyle || window.getComputedStyle(el, null);
    return style.textAlign === "justify"; // Check if text is justified
  };

  const justify = (el, txt, conWidth) => {
    txt = txt.trim(); // Trim text
    const words = txt.split(" ").length; // Count words
    txt = `${txt} `;
    if (words < 2) {
      return txt; // Return if not enough words to justify
    }
    const tmp = document.createElement("span");
    tmp.innerHTML = txt; // Set innerHTML for measurement
    el.appendChild(tmp);
    const size = tmp.offsetWidth; // Measure width
    tmp.parentNode.removeChild(tmp); // Cleanup temporary element
    const wordSpacing = Math.floor((conWidth - size) / (words - 1)); // Calculate word spacing
    tmp.style.wordSpacing = `${wordSpacing}px`; // Set word spacing
    tmp.setAttribute("data-owner", "balance-text-justify"); // Mark for removal later
    const div = document.createElement("div");
    div.appendChild(tmp); // Wrap in div
    return div.innerHTML; // Return modified HTML
  };

  const isBreakChar = (txt, index) => {
    const re = /([^\S\u00a0]|-|\u2014|\u2013|\u00ad)(?![^<]*>)/g; // Regex for break characters
    if (!breakMatches) {
      breakMatches = [];
      let match;
      while ((match = re.exec(txt)) !== null) {
        if (!isWhiteSpaceNoWrap(match.index)) {
          breakMatches.push(match.index); // Store valid break positions
        }
      }
    }
    return breakMatches.indexOf(index) !== -1; // Check if index is a break character
  };

  const isBreakOpportunity = (txt, index) => {
    return index === 0 || index === txt.length || (isBreakChar(txt, index - 1) && !isBreakChar(txt, index)); // Determine if a break is possible
  };

  const findBreakOpportunity = (el, txt, conWidth, desWidth, dir, c, ret) => {
    let w;
    if (txt && typeof txt === "string") {
      for (;;) {
        while (!isBreakOpportunity(txt, c)) {
          c += dir; // Move in the specified direction
        }
        el.innerHTML = txt.substr(0, c); // Set innerHTML to the substring
        w = el.offsetWidth; // Measure width
        if (dir < 0) {
          if (w <= desWidth || w <= 0 || c === 0) {
            break; // Stop if conditions are met
          }
        } else if (desWidth <= w || conWidth <= w || c === txt.length) {
          break; // Stop if conditions are met
        }
        c += dir; // Move to the next character
      }
    }
    ret.index = c; // Update return object
    ret.width = w; // Update return width
  };

  const getSpaceWidth = (el, h) => {
    const container = document.createElement("div");
    container.style.display = "block"; // Set display to block
    container.style.position = "absolute"; // Position absolutely for measurement
    container.style.bottom = 0; // Align to bottom
    container.style.right = 0; // Align to right
    container.style.width = 0; // No width
    container.style.height = 0; // No height
    container.style.margin = 0; // No margin
    container.style.padding = 0; // No padding
    container.style.visibility = "hidden"; // Hide the container
    container.style.overflow = "hidden"; // Prevent overflow
    const space = document.createElement("span");
    space.style.fontSize = "2000px"; // Large font for measurement
    space.innerHTML = "&nbsp;"; // Non-breaking space
    container.appendChild(space);
    el.appendChild(container); // Append to the element for measurement
    const dims = space.getBoundingClientRect(); // Get dimensions
    container.parentNode.removeChild(container); // Cleanup
    const spaceRatio = dims.height / dims.width; // Calculate ratio
    return h / spaceRatio; // Return adjusted height
  };

  const getElementsList = (elements) => {
    if (!elements) {
      return [];
    }
    if (typeof elements === "string") {
      return document.querySelectorAll(elements); // Return node list for selector strings
    }
    if (elements.tagName && elements.querySelectorAll) {
      return [elements]; // Return array for single elements
    }
    return elements; // Return the elements as-is
  };

  const balanceText = (elements) => {
    // Main function to balance text in provided elements
    forEach(getElementsList(elements), (el) => {
      const maxTextWidth = 5000; // Limit for maximum text width
      removeTags(el); // Clean up existing tags
      const oldWS = el.style.whiteSpace; // Store old white-space style
      const oldFloat = el.style.float; // Store old float style
      const oldDisplay = el.style.display; // Store old display style
      const oldPosition = el.style.position; // Store old position style
      const oldLH = el.style.lineHeight; // Store old line-height

      el.style.lineHeight = "normal"; // Reset line-height for calculations
      const containerWidth = el.offsetWidth; // Get container width
      const containerHeight = el.offsetHeight; // Get container height
      el.style.whiteSpace = "nowrap"; // Set nowrap for calculations
      el.style.float = "none"; // Reset float style
      el.style.display = "inline"; // Set display inline for measurements
      el.style.position = "static"; // Reset position

      let nowrapWidth = el.offsetWidth; // Calculate nowrap width
      const nowrapHeight = el.offsetHeight; // Get height after nowrap

      const spaceWidth = oldWS === "pre-wrap" ? 0 : getSpaceWidth(el, nowrapHeight); // Calculate space width

      // Ensure container width is valid and exceeds the nowrap width for processing
      if (containerWidth > 0 && nowrapWidth > containerWidth && nowrapWidth < maxTextWidth) {
        let remainingText = el.innerHTML; // Store remaining text
        let newText = ""; // Initialize new text variable
        let lineText = ""; // Initialize line text variable
        const shouldJustify = isJustified(el); // Determine if the text should be justified
        const totLines = Math.round(containerHeight / nowrapHeight); // Calculate total lines possible
        let remLines = totLines; // Remaining lines to process
        let lineCharOffset = 0; // Character offset for the line
        let desiredWidth, guessIndex, le, ge, splitIndex, isHyphen, isSoftHyphen;

        while (remLines > 1) {
          breakMatches = null; // Reset break matches
          calcNoWrapOffsetsForLine(el, oldWS, lineCharOffset); // Calculate offsets
          desiredWidth = Math.round((nowrapWidth + spaceWidth) / remLines - spaceWidth); // Calculate desired width
          guessIndex = Math.round((remainingText.length + 1) / remLines) - 1; // Initial guess index
          le = new NextWS_params(); // Left exploration params
          findBreakOpportunity(el, remainingText, containerWidth, desiredWidth, -1, guessIndex, le); // Find left break opportunity
          ge = new NextWS_params(); // Right exploration params
          guessIndex = le.index; // Set guess index from left exploration
          findBreakOpportunity(el, remainingText, containerWidth, desiredWidth, +1, guessIndex, ge); // Find right break opportunity
          le.reset(); // Reset left exploration
          guessIndex = ge.index; // Set guess index from right exploration
          findBreakOpportunity(el, remainingText, containerWidth, desiredWidth, -1, guessIndex, le); // Final left exploration

          // Determine the split index based on break opportunities
          let splitIndex;
          if (le.index === 0) {
            splitIndex = ge.index; // If no left break, take right index
          } else if (containerWidth < ge.width || le.index === ge.index) {
            splitIndex = le.index; // Prefer left index
          } else {
            splitIndex = Math.abs(desiredWidth - le.width) < Math.abs(ge.width - desiredWidth) ? le.index : ge.index; // Choose closest
          }

          lineText = remainingText.substr(0, splitIndex).replace(/\s$/, ""); // Extract line text
          isSoftHyphen = Boolean(lineText.match(/\u00ad$/)); // Check for soft hyphen
          if (isSoftHyphen) {
            lineText = lineText.replace(/\u00ad$/, '<span data-owner="balance-text-softhyphen">-</span>'); // Replace with a span for soft hyphen
          }
          if (shouldJustify) {
            newText += justify(el, lineText, containerWidth); // Justify text
          } else {
            newText += lineText; // Append line text
            isHyphen = isSoftHyphen || Boolean(lineText.match(/(-|\u2014|\u2013)$/)); // Check if line ends with a hyphen
            newText += isHyphen ? '<br data-owner="balance-text-hyphen" />' : '<br data-owner="balance-text" />'; // Add appropriate line break
          }
          remainingText = remainingText.substr(splitIndex); // Update remaining text
          lineCharOffset = splitIndex; // Update character offset
          remLines--; // Decrement remaining lines
          el.innerHTML = remainingText; // Update innerHTML to remaining text
          nowrapWidth = el.offsetWidth; // Update nowrap width
        }
        // Finalize text handling
        if (shouldJustify) {
          el.innerHTML = newText + justify(el, remainingText, containerWidth); // Justify remaining text
        } else {
          el.innerHTML = newText + remainingText; // Append remaining text
        }
      }
      // Restore original styles
      el.style.whiteSpace = oldWS; // Restore original white-space
      el.style.float = oldFloat; // Restore original float style
      el.style.display = oldDisplay; // Restore original display style
      el.style.position = oldPosition; // Restore original position
      el.style.lineHeight = oldLH; // Restore original line-height
    });
  };

  const updateWatched = () => {
    const selectors = watching.sel.join(","); // Join selectors for query
    const selectedElements = getElementsList(selectors); // Get elements from selectors
    const elements = Array.prototype.concat.apply(watching.el, selectedElements); // Combine watched elements
    balanceText(elements); // Balance text in combined elements
  };

  const initHandlers = () => {
    if (handlersInitialized) {
      return; // Prevent reinitialization
    }
    ready(updateWatched); // Wait for DOM readiness to update
    window.addEventListener("load", updateWatched); // Update on load
    window.addEventListener("resize", debounce(updateWatched)); // Update on resize event
    handlersInitialized = true; // Set initialized flag
  };

  const balanceTextAndWatch = (elements) => {
    if (typeof elements === "string") {
      watching.sel.push(elements); // Add selector to watch list
    } else {
      forEach(getElementsList(elements), (el) => {
        watching.el.push(el); // Add elements to watch list
      });
    }
    initHandlers(); // Initialize event handlers
    updateWatched(); // Initial update
  };

  const unwatch = (elements) => {
    if (typeof elements === "string") {
      watching.sel = watching.sel.filter((el) => el !== elements); // Remove selector from watch list
    } else {
      elements = getElementsList(elements); // Get element list
      watching.el = watching.el.filter((el) => elements.indexOf(el) === -1); // Remove elements from watch list
    }
  };

  const polyfill = () => {
    if (polyfilled) {
      return; // Skip if already polyfilled
    }
    watching.sel.push(".balance-text"); // Watch default selector
    initHandlers(); // Initialize handlers
    polyfilled = true; // Set polyfilled flag
  };

  const publicInterface = (elements, options) => {
    if (!elements) {
      polyfill(); // Apply polyfill if no elements provided
    } else if (options && options.watch === true) {
      balanceTextAndWatch(elements); // Watch and balance text
    } else if (options && options.watch === false) {
      unwatch(elements); // Stop watching elements
    } else {
      balanceText(elements); // Balance text in provided elements
    }
  };

  publicInterface.updateWatched = updateWatched; // Expose update function
  if (hasTextWrap()) {
    noop.updateWatched = noop; // No operation if text wrap is supported
    return noop; // Return the noop function
  }
  return publicInterface; // Return public interface for text balancing
});

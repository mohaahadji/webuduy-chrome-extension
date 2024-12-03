
let selectedWord = "";
let popup = null; `q`
let buttonDiv = null;
let loadingSpinner = null; // Spinner element
let isExtensionActive = false; // Track the extension's active state


if (!document.querySelector("[data-extension-script='true']")) {
  const scriptElement = document.createElement("script");
  scriptElement.setAttribute("data-extension-script", "true");
  document.body.appendChild(scriptElement);



  // content script logic goes here
  function injectStyles() {
    if (!document.querySelector("#custom-extension-styles")) {
      const style = document.createElement("style");
      style.id = "custom-extension-styles";
      style.textContent = `
        .custom-ext-popup {
          position: absolute;
          background-color: white;
          border-radius: 8px;
          padding: 2px;
          box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.2); /* Even shadow all around */
          z-index: 9999;
        }
       .custom-ext-button {
        display: inline-flex;
        align-items: center;
        color: black;
        padding: 6px 10px;
        background-color: white;
        border-right: 1px solid #d1d5db;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .custom-ext-button:hover {
        background-color: #e5e7eb;
         border-radius: 4px;
      }

      /* Remove the right border from the last button */
      .custom-ext-button:last-child {
        border-right: none;
      }
        .custom-ext-dropdown {
          position: absolute;
          background: white;
          width: auto;
          color: black;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          margin-top: 8px;
          box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 10000;
          display: none;
        }
        .custom-ext-dropdown button {
          display: block;
          width: 100%;
          color: black;
          padding: 6px 8px;
          text-align: left;
          background: white;
          border: none;
          font-size: 14px;
          cursor: pointer;
        }
        .custom-ext-dropdown button:hover {
          background-color: #f3f4f6;
        }
        .custom-ext-loading-spinner {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          border: 4px solid rgba(0, 0, 0, 0.2);
          border-top: 4px solid black;
          border-radius: 50%;
          animation: custom-ext-spin 1s linear infinite;
          z-index: 10000;
        }
        @keyframes custom-ext-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Function to show loading spinner

  
  // Function to handle AI actions directly
  async function handleAction(action, text) {
    try {
  
      if (action.startsWith("translate-")) {
        const targetLanguageKey = action.split("-")[1];
        const languageMap = {
          english: "en",
          spanish: "es",
          japanese: "ja",
        };
  
        const targetLanguage = languageMap[targetLanguageKey];
        if (!targetLanguage) {
          console.error("Unsupported language:", targetLanguageKey);
          createModal(`Error: Unsupported language - ${targetLanguageKey}`);
          return;
        }
  
        const languagePair = { sourceLanguage: "en", targetLanguage };
  
        // Check if translation is available
        const canTranslate = await window.translation.canTranslate(languagePair);
        if (canTranslate === "no") {
          createModal("Translation is not available for this language pair.");
          return;
        }
  
        let translator;
        if (canTranslate === "readily") {
          translator = await window.translation.createTranslator(languagePair);
        } else {
          translator = await window.translation.createTranslator(languagePair);
          translator.addEventListener("downloadprogress", (e) => {
            const percent = Math.round((e.loaded / e.total) * 100);
            console.log(`Downloading translation model: ${percent}%`);
          });
          await translator.ready;
        }
  
        const translatedText = await translator.translate(text);
        console.log("Translated Text:", translatedText);
        createModal(translatedText);
  
        translator.destroy();
      } else if (action === "summarize") {
        // Check summarizer capabilities
        const canSummarize = await window.ai.summarizer.capabilities();
        if (canSummarize.available === "no") {
          createModal("Summarization is not available.");
          return;
        }
      
        // Create modal with loading state
        const modal = createModal("Summarizing..."); // Display initial loading state
        const modalContent = modal.querySelector(".ai-modal-content"); // Get the modal content container
      
        try {
          let summarizer = await window.ai.summarizer.create();
      
          // Handle model downloading state
          if (canSummarize.available !== "readily") {
            summarizer.addEventListener("downloadprogress", (e) => {
              modalContent.querySelector("p").textContent = `Downloading model: ${e.loaded} / ${e.total}`;
            });
            await summarizer.ready;
          }
      
          // Perform summarization
          const summary = await summarizer.summarize(text);
          console.log("Summary:", summary);
      
          // Update modal content with the summary
          modalContent.querySelector("p").textContent = summary;
      
          summarizer.destroy();
        } catch (error) {
          console.error("Error during summarization:", error);
          modalContent.querySelector("p").textContent = "An error occurred while summarizing.";
        }
      } else if (action === "explain") {
        // Check if the Prompt API is readily available
        const { available } = await window.ai.languageModel.capabilities();
        if (available !== "readily") {
          console.error("Prompt API is not available.");
          createModal("Prompt API is not available.");
          return;
        }
      
        // Create modal with loading state
        const modal = createModal("Explaining..."); // Initial loading message
        const modalContent = modal.querySelector(".ai-modal-content");
      
        try {
          // Create a session and send the prompt
          const session = await window.ai.languageModel.create();
          const prompt = `Explain this concisely briefly and directly: ${text}`;
          const explainedText = await session.prompt(prompt);
      
          console.log("Explained Text:", explainedText);
      
          // Update modal content with the explained text
          modalContent.querySelector("p").textContent = explainedText;
      
          session.destroy(); // Clean up session
        } catch (error) {
          console.error("Error during explanation:", error);
          modalContent.querySelector("p").textContent = "An error occurred while explaining.";
        }
      } else if (action === "rewrite") {
        const modal = createModal("Rewriting...");
        const modalContent = modal.querySelector(".ai-modal-content");
      
        try {
          const rewriter = await window.ai.rewriter.create({
            context: "Rewrite this text to improve clarity and readability.",
            language: "en",
          });
      
          const stream = await rewriter.rewriteStreaming(text, {
            context: "Rewrite to be more concise and professionally brief.",
          });
      
          let rewrittenText = ""; // Initialize rewritten text
      
          for await (const chunk of stream) {
            const cleanChunk = chunk.trim(); // Clean chunk
            if (!rewrittenText.endsWith(cleanChunk)) {
              rewrittenText = cleanChunk; // Avoid duplication
            }
            modalContent.querySelector("p").textContent = rewrittenText; // Update modal dynamically
          }
      
          console.log("Rewritten Text:", rewrittenText);
          modalContent.querySelector("p").textContent = rewrittenText; // Finalize modal content
          rewriter.destroy(); // Clean up
        } catch (error) {
          console.error("Error during rewriting:", error);
          modalContent.querySelector("p").textContent = "An error occurred while rewriting.";
        }
      } else {
        createModal("Action not supported.");
      }
    } catch (error) {
      console.error("Error handling action:", error);
      createModal(`Error: ${error.message}`);
    } 
  }
  
  // Function to create the action popup
  function createPopup(x, y, text) {
    if (popup) popup.remove();
    if (buttonDiv) buttonDiv.remove();
  
    popup = document.createElement("div");
    popup.className = "custom-ext-popup";
    popup.style.left = `${x}px`;
    popup.style.top = `${y - 80}px`;
  
    document.body.appendChild(popup);
  
    const actions = ["Explain", "Summarize", "Rewrite", "Translate", "Read Aloud"];
    buttonDiv = document.createElement("div");
    buttonDiv.style.display = "flex";
  
    actions.forEach((action) => {
      if (action === "Translate") {
        const translateContainer = document.createElement("div");
        const translateButton = document.createElement("button");
        translateButton.textContent = action;
        translateButton.className = "custom-ext-button";
  
        const triangle = document.createElement("span");
        triangle.style.display = "inline-block";
        triangle.style.borderLeft = "4px solid transparent";
        triangle.style.borderRight = "4px solid transparent";
        triangle.style.borderTop = "4px solid black";
        triangle.style.marginLeft = "4px";
        translateButton.appendChild(triangle);
  
        const dropdown = document.createElement("div");
        dropdown.className = "custom-ext-dropdown";
  
        const languages = ["English", "Spanish", "Japanese"];
        languages.forEach((lang) => {
          const langButton = document.createElement("button");
          langButton.textContent = lang;
          langButton.addEventListener("click", () => {
            handleAction(`translate-${lang.toLowerCase()}`, text);
            dropdown.style.display = "none";
          });
          dropdown.appendChild(langButton);
        });
  
        translateButton.addEventListener("click", () => {
          dropdown.style.display =
            dropdown.style.display === "none" ? "block" : "none";
        });
  
        translateContainer.appendChild(translateButton);
        translateContainer.appendChild(dropdown);
  
        buttonDiv.appendChild(translateContainer);
      } else if (action === "Read Aloud") {
        const button = document.createElement("button");
        button.textContent = action;
        button.className = "custom-ext-button";
        button.addEventListener("click", () => showCustomAudioPlayer(text));
        buttonDiv.appendChild(button);
      } else {
        const button = document.createElement("button");
        button.textContent = action;
        button.className = "custom-ext-button";
        button.addEventListener("click", () => handleAction(action.toLowerCase(), text));
        buttonDiv.appendChild(button);
      }
    });
  
    popup.appendChild(buttonDiv);
  }

  const styleElement = document.createElement("style");
styleElement.textContent = `
  .custom-slider {
    -webkit-appearance: none; /* Remove default appearance for WebKit browsers */
    appearance: none; /* Remove default appearance for modern browsers */
    width: 100%;
    height: 6px;
    background: linear-gradient(to right, #333 0%, #333 0%, #e5e7eb 0%, #e5e7eb 100%); /* Gradient for progress */
    border-radius: 3px;
    outline: none;
    transition: background 0.3s;
  }

  .custom-slider::-webkit-slider-thumb {
    -webkit-appearance: none; /* Remove default appearance */
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #333; /* Black thumb */
    cursor: pointer;
    transition: background 0.3s;
  }

  .custom-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #333;
    cursor: pointer;
    transition: background 0.3s;
  }

  .custom-slider::-ms-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #333;
    cursor: pointer;
    transition: background 0.3s;
  }

  .custom-slider:hover::-webkit-slider-thumb {
    background: #555; /* Darker thumb on hover */
  }

  .custom-slider:hover::-moz-range-thumb {
    background: #555;
  }

  .custom-slider:hover::-ms-thumb {
    background: #555;
  }
`;

document.head.appendChild(styleElement);

function showCustomAudioPlayer(text) {
  const existingPlayer = document.querySelector(".custom-audio-player");
  if (existingPlayer) existingPlayer.remove();

  let isPlaying = false; // Tracks play/pause state
  let currentTime = 0; // Current playback time
  let interval = null; // Interval for programmatic slider updates

  const estimatedDuration = Math.ceil(text.split(/\s+/).length / 2.5); // Estimate duration based on words
  const playerContainer = document.createElement("div");
  playerContainer.className = "custom-audio-player";
  playerContainer.style = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    background: white;
    border-radius: 30px;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.2);
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 10000;
  `;

  const playButton = document.createElement("button");
  playButton.style = `
    background: none;
    border: none;
    cursor: pointer;
  `;
  playButton.innerHTML = `
    <svg class="h-8 w-8 text-gray-500" width="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  `;

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = 0;
  slider.max = estimatedDuration;
  slider.value = 0;
  slider.className = "custom-slider";
  slider.style = `
    flex: 1;
    cursor: pointer;
    appearance: none;
  `;

  const timeDisplay = document.createElement("div");
  timeDisplay.textContent = `0:00 / ${formatTime(estimatedDuration)}`;
  timeDisplay.style = `
    font-size: 14px;
    color: #333;
    min-width: 80px;
    text-align: right;
  `;

  function updateTimeDisplay() {
    timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(estimatedDuration)}`;
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }

  function updateSliderBackground() {
    const percentage = (currentTime / estimatedDuration) * 100;
    slider.style.background = `linear-gradient(to right, #333 ${percentage}%, #e5e7eb ${percentage}%)`;
  }

  function startPlayback() {
    isPlaying = true;
    playButton.innerHTML = `
      <svg class="h-8 w-8 text-gray-500" width="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    `;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;

    utterance.onboundary = (event) => {
      currentTime = Math.floor(event.elapsedTime / 1000);
      updateTimeDisplay();
      slider.value = currentTime;
      updateSliderBackground();
    };

    utterance.onend = () => {
      isPlaying = false;
      playButton.innerHTML = `
        <svg class="h-8 w-8 text-gray-500" width="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      `;
    };

    window.speechSynthesis.speak(utterance);
  }

  function stopPlayback() {
    isPlaying = false;
    playButton.innerHTML = `
      <svg class="h-8 w-8 text-gray-500" width="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    `;
    window.speechSynthesis.cancel();
  }

  playButton.addEventListener("click", () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  });

  const closeButton = document.createElement("button");
  closeButton.style = `
    background: none;
    border: none;
    cursor: pointer;
  `;
  closeButton.innerHTML = `
    <svg class="h-8 w-8 text-gray-500" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  `;
  closeButton.addEventListener("click", () => {
    stopPlayback();
    playerContainer.remove();
  });

  slider.addEventListener("input", (e) => {
    currentTime = parseInt(e.target.value, 10);
    updateTimeDisplay();
    updateSliderBackground();
  });

  playerContainer.appendChild(playButton);
  playerContainer.appendChild(slider);
  playerContainer.appendChild(timeDisplay);
  playerContainer.appendChild(closeButton);

  document.body.appendChild(playerContainer);
}
  
  // Inject styles when the script runs
  injectStyles();
  
  // Function to create a modal to display AI responses
  function createModal(initialText = "") {
    console.log("Creating modal with text:", initialText);
  
    // Check if a modal already exists
    let modal = document.querySelector(".ai-response-modal");
    
    if (modal) {
      // Update the text if modal already exists
      const responseText = modal.querySelector("p");
      if (responseText) responseText.textContent = initialText;
      return; // Exit since modal already exists
    }
  
    // Prevent scrolling when modal is open
    document.body.style.overflow = "hidden";
  
    // Create modal container
    modal = document.createElement("div");
    modal.className = "ai-response-modal";
    modal.style = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      display: flex; align-items: center; justify-content: center;
      background-color: rgba(0, 0, 0, 0.5); z-index: 9999;`;
  
    // Create modal content container
    const modalContent = document.createElement("div");
    modalContent.className = "ai-modal-content"; // Add a class for easier querying
    modalContent.style = `
      position: relative;
      background: white; padding: 20px; border-radius: 10px; 
      max-width: 400px; width: 90%; text-align: center;`;
  
    // Add dynamic text content container
    const responseText = document.createElement("p");
    responseText.style = `
      margin-bottom: 20px;
      margin-top: 20px; 
      font-size: 16px; 
      line-height: 1.5; 
      color: black;
      word-wrap: 
      break-word;`;
    responseText.textContent = initialText;
  
    // Create container for actions (copy and speaker)
    const actionsContainer = document.createElement("div");
    actionsContainer.style = `
      display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;`;
  
    // Create copy icon button
    const copyIcon = document.createElement("button");
    copyIcon.style = `
      background: none; 
      border: none; 
      cursor: pointer; 
      padding: 4px;
      color: black;
      width: 40px; 
      height: 40px;
      display: flex; 
      align-items: center;`;
    copyIcon.innerHTML = `
      <svg class="h-8 w-8 text-black" width="20" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" />
      </svg>
    `;
    copyIcon.addEventListener("click", () => {
      navigator.clipboard.writeText(responseText.textContent).then(() => {
        alert("Text copied to clipboard!");
      });
    });
  
    // Create speaker icon button
    const speakerIcon = document.createElement("button");
    speakerIcon.style = `
      width: 40px; 
      height: 40px;
      background: none; 
      border: none; 
      cursor: pointer; 
      padding: 4px;
      color: black; 
      display: flex; 
      align-items: center;`;
    speakerIcon.innerHTML = `
      <svg class="h-8 w-8 text-black" width="20" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
      </svg>
    `;
    speakerIcon.addEventListener("click", () => {
      const speech = new SpeechSynthesisUtterance(responseText.textContent);
      speech.lang = "en-US";
      window.speechSynthesis.speak(speech);
    });
  
    // Create close button
    const closeButton = document.createElement("button");
    closeButton.style = `
      width: 40px; 
      height: 40px;
      position: absolute; 
      top: 10px; 
      right: 10px; 
      background: none; 
      border: none; 
      cursor: pointer; color: black; padding: 4px;`;
    closeButton.innerHTML = `
      <svg class="h-4 w-4 text-black" width="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    `;
    closeButton.addEventListener("click", () => {
      modal.remove();
      document.body.style.overflow = ""; // Re-enable scrolling
    });
  
    // Append actions to container
    actionsContainer.appendChild(copyIcon);
    actionsContainer.appendChild(speakerIcon);
  
    // Append elements to modal content and modal
    modalContent.appendChild(closeButton);
    modalContent.appendChild(responseText);
    modalContent.appendChild(actionsContainer);
    modal.appendChild(modalContent);
  
    // Append modal to body
    document.body.appendChild(modal);
  
    return modal; // Return the modal for dynamic updates
  }
  
  // Mouseup event listener to detect selected text
  document.addEventListener("mouseup", (event) => {
    const selection = window.getSelection().toString().trim();
  
    if (selection && popup === null || buttonDiv === null) {
      const range = window.getSelection().getRangeAt(0).getBoundingClientRect();
      const x = range.left + window.pageXOffset;
      const y = range.bottom + window.pageYOffset;
  
      createPopup(x, y, selection);
      selectedWord = selection;
    } else if (!selection && popup !== null && buttonDiv !== null) {
      popup.remove();
      buttonDiv.remove();
      popup = null;
      buttonDiv = null;
    }
  });
  
  
  console.log("Content script is running...");
}


// Create the container for the chatbot
const chatContainer = document.createElement('div');
chatContainer.id = 'chatbot-container';
Object.assign(chatContainer.style, {
  position: 'fixed',
  bottom: '20px',
  right: '10px',
  width: '375px', // iPhone width
  height: '50px', // iPhone height (default collapsed)
  background: 'rgba(255, 255, 255, 0.4)', // Semi-transparent white
  backdropFilter: 'blur(10px)', // Glassmorphism effect
  border: '1px solid rgba(255, 255, 255, 0.2)', // Subtle border
  color: 'inherit', // Inherit text color from the page
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '20px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', // Elevation shadow
  overflow: 'hidden',
  zIndex: '9999',
  transition: 'height 0.3s ease-in-out, background 0.3s ease-in-out', // Smooth transitions
});

const adjustForMode = () => {
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  Object.assign(chatContainer.style, {
    background: isDarkMode ? 'rgba(18, 18, 18, 0.8)' : 'rgba(255, 255, 255, 0.6)',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
    color: isDarkMode ? 'white' : 'black',
  });
};
adjustForMode();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', adjustForMode);

// Create the collapsible header
const chatHeader = document.createElement('div');
chatHeader.id = 'chatbot-header';
Object.assign(chatHeader.style, {
  padding: '10px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '16px',
});

// Add header title
const headerTitle = document.createElement('span');
headerTitle.innerText = 'AI Assistant';
Object.assign(headerTitle.style, {
  fontSize: '16px',
  fontWeight: 'bold',
});

// Add a collapse/expand button
const collapseButton = document.createElement('span');
collapseButton.innerText = '+';
Object.assign(collapseButton.style, {
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
});

// Add header elements to header
chatHeader.appendChild(headerTitle);
chatHeader.appendChild(collapseButton);

// Create the chat display area
const chatDisplay = document.createElement('div');
chatDisplay.id = 'chatbot-display';
Object.assign(chatDisplay.style, {
  flex: '1',
  padding: '10px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  opacity: '0', // Hidden by default
  transition: 'opacity 0.3s ease-in-out',
});

// Create the input bar container
const inputBarContainer = document.createElement('div');
Object.assign(inputBarContainer.style, {
  display: 'flex',
  alignItems: 'center',
  padding: '10px',
  background: 'inherit',
  backdropFilter: 'blur(10px)', // Matches glassmorphism
  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
});

// Create the input field
const textInput = document.createElement('input');
textInput.type = 'text';
Object.assign(textInput.style, {
  color: 'white',
  backgroundColor: '#2C2C2C',
  flex: '1',
  padding: '10px',
  border: 'none',
  borderRadius: '4px',
  marginRight: '10px',
});
textInput.placeholder = 'How can I help you today?';

// Create the send button
const sendButton = document.createElement('button');
sendButton.innerText = 'Send';
Object.assign(sendButton.style, {
  padding: '10px 15px',
  backgroundColor: '#007BFF',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
});


// Add input and button to the input bar
inputBarContainer.appendChild(textInput);
inputBarContainer.appendChild(sendButton);

// Add elements to the chat container
chatContainer.appendChild(chatHeader);
chatContainer.appendChild(chatDisplay);
chatContainer.appendChild(inputBarContainer);

// Append the chat container to the body
document.body.appendChild(chatContainer);

// Call the function to get the recipe
async function getRecipeIngredients(userQuery) {
  const session = await window.ai.languageModel.create();

  // Define the prompt to only return a list of ingredients
  const prompt = `You are a shopping assistant. The user asked: "${userQuery}". Provide only a list of things needed, nothing extra text at all.`;

  // Start the AI streaming response
  const stream = session.promptStreaming(prompt);

  let botResponse = '';

  // Collect the chunks of response from the AI
  for await (const chunk of stream) {
      botResponse = chunk;  // Accumulate the response
  }

  // Clean up the response: remove any leading/trailing whitespace and special characters like '*'
  const cleanedIngredients = botResponse
      .split('\n')  // Split by line breaks
      .map(item => item.replace(/[*]+/g, '').trim())  // Remove '*' characters and trim extra spaces
      .filter(item => item.length > 0);  // Remove empty items

  return cleanedIngredients;
}

const addToCartButton = document.querySelector('[data-csa-c-type="action"][data-csa-c-action-name="addToCart"]');

if (addToCartButton){
  setTimeout(() => {
    if (addToCartButton) {
        addToCartButton.click(); // Simulate clicking the "Add to Cart" button
    }
}, 3000); // Wait 5 seconds for the page to load, adjust if necessary
}

// Function to open Amazon links for each ingredient and add to cart
async function addItemsToCart(ingredients) {
  for (const ingredient of ingredients) {
      // Create the URL for the ingredient search
      const url = `https://www.amazon.com/s?k=${encodeURIComponent(ingredient)}`;
      
      // Open the URL in a new tab and store a reference to it
      const newTab = window.open(url, '_blank');
      
      // Wait for 5 seconds before closing the tab
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Close the tab
      if (newTab) {
          newTab.close();
      }
  }
}





async function fillFormOnLoad(bookTitle) {
  console.log("Autofill process started...");

  try {
    if (!window.ai || !window.ai.languageModel || !window.translation) {
      console.error("AI API or Translation API not available.");
      return;
    }

    // Generate form data in English
    const session = await window.ai.languageModel.create();
    const prompt = `
      Generate the following JSON in English:
      - Title: "${bookTitle}"
      - Subtitle: A subtitle for the book.
      - Description: A detailed description for the book.
      - Keywords: A list of 7 relevant keywords.
    `;
    const englishResult = await session.prompt(prompt);

    let formData;

    // Parse AI response
    try {
      const englishResponse = englishResult.trim().replace(/^```json|```$/g, "");
      formData = JSON.parse(englishResponse);
      console.log("Generated English form data:", formData);
    } catch (error) {
      console.error("Failed to parse AI response as JSON. Response:", englishResult);
      return;
    }

    // Translate the form data if the selected language is not English
 

    // Fill the form with the final (translated or English) data
    await fillFormBasedOnResponse(formData);
  } catch (error) {
    console.error("Error during form autofill:", error);
  }
}

// Translate form data to the selected language


// Fill the form based on the data (English or translated)
async function fillFormBasedOnResponse(formData) {
  try {
    console.log("Filling form with data:", formData);

    // Wait for title field to load and fill it
    await waitForElement("#data-print-book-title", (titleField) => {
      if (titleField) {
        titleField.value = formData.Title || "";
        console.log("Title field filled with:", formData.Title);
      } else {
        console.error("Title field not found.");
      }
    });

    // Wait for subtitle field to load and fill it
    await waitForElement("#data-print-book-subtitle", (subtitleField) => {
      if (subtitleField) {
        subtitleField.value = formData.Subtitle || "";
        console.log("Subtitle field filled with:", formData.Subtitle);
      } else {
        console.error("Subtitle field not found.");
      }
    });

    // Wait for language field to load and fill it
    await waitForElement(
      'input[aria-label="language-dropdown-editable-text"]',
      (languageField) => {
        if (languageField) {
          languageField.value = formData.Language || userSelectedLanguage; // Fill with user's language
          console.log("Language field filled with:", formData.Language);
        } else {
          console.error("Language field not found.");
        }
      }
    );

    // Wait for iframe (description field) to load and fill it
    await waitForElement("iframe.cke_wysiwyg_frame", (iframe) => {
      if (iframe) {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc && iframeDoc.body) {
          iframeDoc.body.innerHTML = formData.Description || "";
          console.log("Description field filled with:", formData.Description);
        } else {
          console.error("Iframe document or body not accessible.");
        }
      } else {
        console.error("Iframe not found.");
      }
    });

    // Wait for keywords fields and fill them
    const keywords = Array.isArray(formData.Keywords) ? formData.Keywords : [];
    keywords.forEach((keyword, index) => {
      waitForElement(`#data-print-book-keywords-${index}`, (keywordInput) => {
        if (keywordInput) {
          keywordInput.value = keyword;
          keywordInput.dispatchEvent(new Event("input", { bubbles: true }));
          console.log(`Keyword #${index} filled with:`, keyword);
        } else {
          console.error(`Keyword field #data-print-book-keywords-${index} not found.`);
        }
      });
    });

    console.log("Form filled successfully.");
  } catch (error) {
    console.error("Error filling form:", error);
  }
}

// Helper function to wait for an element to be available in the DOM
function waitForElement(selector, callback) {
  const interval = setInterval(() => {
    const element = document.querySelector(selector);
    if (element) {
      clearInterval(interval);
      callback(element);
    }
  }, 500); // Check every 500ms
}

async function handleTranslation(action) {
  console.log("Translation process started...");

  try {
    // Ensure the translation API is available
    if (!window.translation) {
      throw new Error("Translation API is not available in this environment.");
    }

    // Map of supported languages
    const languageMap = {
      english: "en",
      spanish: "es",
      japanese: "ja",
      french: "fr",
      german: "de",
    };

    // Get the target language code
    const targetLanguage = languageMap[action.toLowerCase()];
    if (!targetLanguage) {
      throw new Error(`Unsupported language: ${action}`);
    }

    // Define the language pair for translation
    const languagePair = { sourceLanguage: "en", targetLanguage };
    console.log(`Translating to ${action} (${targetLanguage})...`);

    // Check if translation is available
    const canTranslate = await window.translation.canTranslate(languagePair);
    if (canTranslate === "no") {
      throw new Error("Translation is not available for this language pair.");
    }

    // Create the translator
    let translator = await window.translation.createTranslator(languagePair);
    if (canTranslate !== "readily") {
      translator.addEventListener("downloadprogress", (e) => {
        const percent = Math.round((e.loaded / e.total) * 100);
        console.log(`Downloading translation model: ${percent}%`);
      });
      await translator.ready;
    }

    // Function to translate text nodes
    const translateTextNodes = async (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          const originalText = child.nodeValue.trim();
          if (originalText) {
            console.log("Translating text:", originalText);
            try {
              const translatedText = await translator.translate(originalText);
              child.nodeValue = translatedText;
            } catch (translationError) {
              console.error("Error translating text:", translationError);
            }
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          await translateTextNodes(child);
        }
      }
    };

    // Start translating the body
    console.log("Starting text translation...");
    await translateTextNodes(document.body);
    console.log("Text translation completed.");
  } catch (error) {
    console.error("Error during translation:", error);
    alert(`Error: ${error.message}`);
  } finally {
    console.log("Hiding spinner...");
  }
}
// Function to add a message to the chat display
const addMessage = (sender, message) => {
  const messageContainer = document.createElement('div');
  messageContainer.style.marginBottom = '10px';
  messageContainer.style.display = 'flex';
  messageContainer.style.flexDirection = sender === 'You' ? 'row-reverse' : 'row';
  messageContainer.style.alignItems = 'flex-start';

  const bubble = document.createElement('div');
  bubble.innerText = message;
  bubble.style.maxWidth = '90%';
  bubble.style.padding = '10px';
  bubble.style.borderRadius = '15px';
  bubble.style.background = sender === 'You' ? '#696969' : 'transparent';
  bubble.style.color = 'white';
  bubble.style.textAlign = 'left';

  const messageImage = document.createElement('img');
  messageImage.src = 'https://www.shutterstock.com/image-vector/chat-bot-icon-virtual-smart-600nw-2478937555.jpg';
  messageImage.style.width = '30px';
  messageImage.style.height = '30px';
  messageImage.style.marginRight = '4px';
  messageImage.style.borderRadius = '20px';

  if (sender !== 'You') {
    messageContainer.appendChild(messageImage);
  }
  messageContainer.appendChild(bubble);
  chatDisplay.appendChild(messageContainer);

  // Scroll to the bottom
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
};


// Function to generate AI-based tags or questions
const getSuggestedTags = async () => {
  // Now using the pre-stored page content
  const session = await window.ai.languageModel.create();
  const prompt = `Based on the following webpage content, generate 3 quick tags or questions a user might ask. Provide only the tags, separated by line breaks, without any extra text or introductions: "${pageContent}"`;

  const stream = session.promptStreaming(`${prompt} Output in JSON format, Do not use markdown.`);
  let botResponse = '';
  for await (const chunk of stream) {
    botResponse += chunk;
  }

  return botResponse.split('\n').filter(tag => tag.trim() !== ''); // Process response into tags
};


const createSkeletonLoader = () => {
  const skeleton = document.createElement('div');
  skeleton.style.width = `${Math.random() * (200 - 100) + 100}px`; // Random width
  skeleton.style.height = '20px';
  skeleton.style.background = '#C0C0C0';
  skeleton.style.borderRadius = '4px';
  skeleton.style.animation = 'skeleton-loading 1.5s infinite ease-in-out';
  skeleton.style.marginBottom = '5px';

  return skeleton;
};

// Function to show skeleton loader
const showSkeletonLoader = (parent, count = 3) => {
  const loaderContainer = document.createElement('div');
  loaderContainer.id = 'skeleton-container';
  loaderContainer.style.display = 'flex';
  loaderContainer.style.flexDirection = 'column';
  loaderContainer.style.gap = '5px';

  for (let i = 0; i < count; i++) {
    loaderContainer.appendChild(createSkeletonLoader());
  }

  parent.appendChild(loaderContainer);
};

// Function to remove skeleton loader
const removeSkeletonLoader = () => {
  const loaderContainer = document.getElementById('skeleton-container');
  if (loaderContainer) {
    loaderContainer.remove();
  }
};



// Function to display quick tags (AI-generated)
const displayQuickTags = async () => {
  // Clear existing skeletons or tag containers
  const existingTagContainer = document.getElementById('skeleton');
  if (existingTagContainer) {
    existingTagContainer.remove();
  }

  const tagContainer = document.createElement('div');
  tagContainer.id = 'quick-tags';
  Object.assign(tagContainer.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '10px',
  });

  chatDisplay.prepend(tagContainer);

  // Add skeletons

  

  // Add keyframes for the skeleton animation

  
  // Create a container to hold the skeletons
  
  // Create 3 skeleton loading indicators and append to the container

  
  if (chatDisplay) {
    chatDisplay.prepend(tagContainer);
  } else {
    console.error('chatDisplay element not found');
  }
  try {
    const tags = await getSuggestedTags();
    tagContainer.innerHTML = ''; // Clear skeletons
    tags.forEach(tag => {
      const tagButton = document.createElement('button');
      tagButton.innerText = tag;
      Object.assign(tagButton.style, {
        backgroundColor: '#E8E8E8',
        color: 'black',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
      });
      tagButton.addEventListener('click', () => {
        textInput.value = tag; // Auto-fill input with the tag
        sendButton.click();
      });
      tagContainer.appendChild(tagButton);
    });
  } catch (error) {
    console.error('Error loading tags:', error);
    tagContainer.innerHTML = '<span style="color: red;">Failed to load tags.</span>';
  }
};

// Run this when the page is loaded to generate and display tags
window.onload = () => {
  pageContent = document.body.innerText;
};


const loadingContainer = document.createElement('div');
loadingContainer.style.marginBottom = '10px';
loadingContainer.style.display = 'flex';
loadingContainer.style.flexDirection =  'row';
loadingContainer.style.alignItems = 'flex-start';



const messageImage = document.createElement('img');
  messageImage.src = 'https://www.shutterstock.com/image-vector/chat-bot-icon-virtual-smart-600nw-2478937555.jpg'
  messageImage.style.width = '30px';
  messageImage.style.height = '30px';
  messageImage.marginRight = '4px';
  messageImage.style.borderRadius = '20px';

// Event listener for the send button
sendButton.addEventListener('click', async () => {
  const userQuery = textInput.value.trim();
  if (!userQuery) return;

  // Display user's message
  addMessage('You', userQuery);

  // Show skeleton loader
  sendButton.disabled = true;
  showSkeletonLoader(chatDisplay);

  try {
    let botResponse;

    if (userQuery.toLowerCase().startsWith('translate ')) {
      const action = userQuery.substring('translate the page to '.length).trim(); // Extract language
      await handleTranslation(action); // Pass extracted language
      botResponse = `Translation to ${action} completed.`;
    } else if (userQuery.toLowerCase().startsWith('fill the form ')) {
      const action = userQuery.substring('fill the form about book title '.length).trim(); // Extract language
      await fillFormOnLoad(action); // Pass extracted language
      botResponse = `Form Filled for book title ${action} completed.`;
    } else if (userQuery.toLowerCase().startsWith('write email')) {
      try {
        // Generate email content using AI API
        const writer = await window.ai.writer.create({
          sharedContext: 'writing an email based on user input.',
        });
        const stream = await writer.writeStreaming(`${userQuery} Please generate an email with the following structure:
              1. The first line should contain the subject, prefixed with "Subject:".
              2. The body of the email should be formatted in a way that begins with a greeting, then the main content, and ends with a signature.
              3. Ensure the body is clear and professional, and include placeholders like "[Recipient's Name]" and "[Your Name]" for personalization.
              `);
        let rawContent = '';
        for await (const chunk of stream) {
          rawContent = chunk;
        }
  
        // Format the email body
        function extractSubjectAndBody(response) {
          // Split the response by lines
          const lines = response.split('\n');
        
          // Extract the subject (first line)
          const subject = lines[0].replace('Subject: ', '').trim();
        
          // Extract the body (everything after the first line)
          const body = lines.slice(1).join('\n').trim();
        
          // Return the extracted subject and body
          return { subject, body };
        }
        
        // Extract subject and body
        const { subject, body } = extractSubjectAndBody(rawContent);
        
        // Format body as HTML for Gmail
        const formattedBody = `
          <p>${body.replace(/\n/g, '<br>')}</p>
        `;
        
        // Inject content into Gmail fields
        const subjectElement = document.querySelector('input[name="subjectbox"]');
        const bodyElement = document.querySelector('div[contenteditable="true"][aria-label="Message Body"]');
        
        if (subjectElement && bodyElement) {
          // Set the extracted subject
          subjectElement.value = subject;
          
          // Set the extracted body content in HTML format
          bodyElement.innerHTML = formattedBody;
        
        botResponse = 'Email writing completed'
        } else {
          console.error('Email fields not found!');
        }
      } catch (error) {
        console.error('Error generating email:', error);
      } 
    } else if (userQuery.toLowerCase().startsWith('shop')){
    // Example usage:
    async function processRecipeIngredients(userQuery) {
      // Get the list of ingredients from the AI
      const ingredients = await getRecipeIngredients(userQuery);
      botResponse = `shoping for: ${ingredients}`;

      console.log("Ingredients received:", ingredients);
      
      // Call the function to add items to cart based on the ingredients
      await addItemsToCart(ingredients);
  }
  processRecipeIngredients(userQuery);
  botResponse = `Shopping...`;


    } else {
      const session = await window.ai.languageModel.create();
      const prompt = `You are an assiatant who answer user questions: "${userQuery} from the webpage: "${pageContent}"`;
      const stream = session.promptStreaming(prompt);

      for await (const chunk of stream) {
        botResponse = chunk;
      }
    }

    // Display the bot's response
    addMessage('Bot', botResponse);
  } catch (error) {
    console.error('Error processing query:', error);
    addMessage('Bot', 'An error occurred while processing your request.');
  }

  // Remove skeleton loader and re-enable button
  removeSkeletonLoader();
  sendButton.disabled = false;

  // Clear the input field
  textInput.value = '';
});


// Allow "Enter" key to send messages
textInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendButton.click();
  }
});

// Toggle chat visibility on header click
chatHeader.addEventListener('click', () => {
  const isCollapsed = chatContainer.style.height === '50px';
  chatContainer.style.height = isCollapsed ? '667px' : '50px'; // Toggle between full and collapsed
  collapseButton.innerText = isCollapsed ? '-' : '+';
  chatDisplay.style.opacity = isCollapsed ? '1' : '0'; // Show messages in expanded state
  inputBarContainer.style.display = isCollapsed ? 'flex' : 'none'; // Show input in expanded state
});


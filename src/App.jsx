import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  // Reference to the iframe for communicating with the chatbot
  const chatbotRef = useRef(null);
  
  const [focusProfile, setFocusProfile] = useState({
    preferredEnvironment: '',
    distractions: [],
    productiveHours: '',
    currentChallenges: ''
  });
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [tips, setTips] = useState([
    "Turn off digital distractions when focusing (e.g. Put your phone on Do Not Disturb).",
    "Use the 2-minute rule: if it takes less than 2 minutes, do it now",
    "Keep track of your focus time to find what works best.",
    "Set up your space to help you concentrate."
  ]);
  
  // Load focus profile and tips from localStorage on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('focusProfile');
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setFocusProfile(parsedProfile);
      } catch (error) {
        console.error('Error parsing saved profile:', error);
      }
    }
    
    const savedTips = localStorage.getItem('focusTips');
    if (savedTips) {
      try {
        const parsedTips = JSON.parse(savedTips);
        setTips(parsedTips);
      } catch (error) {
        console.error('Error parsing saved tips:', error);
      }
    }
    
    // Set up event listener for messages from the iframe
    window.addEventListener('message', handleChatbotMessage);
    
    return () => {
      window.removeEventListener('message', handleChatbotMessage);
    };
  }, []);
  
  // Save focus profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('focusProfile', JSON.stringify(focusProfile));
  }, [focusProfile]);
  
  // Save tips to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('focusTips', JSON.stringify(tips));
  }, [tips]);
  
  // Handle messages from the chatbot iframe
  const handleChatbotMessage = (event) => {
    // Debug logging
    console.log("Received message event:", event.origin, event.data);
    
    // Check if the message is from Chatbase or contains data we can use
    if (event.origin.includes('chatbase.co') || 
        (event.data && typeof event.data === 'object')) {
      try {
        const data = event.data;
        console.log("Processing chatbot message data:", data);
        
        // Check for various message formats from Chatbase
        let message = '';
        
        // Format 1: Direct message object with type and content
        if (data && data.type === 'CHATBASE_RESPONSE' && data.message) {
          message = data.message;
        } 
        // Format 2: Message object with content property
        else if (data && data.content) {
          message = data.content;
        }
        // Format 3: Message object with text property
        else if (data && data.text) {
          message = data.text;
        }
        // Format 4: Direct string message
        else if (typeof data === 'string') {
          message = data;
        }
        // Format 5: Message in a nested structure
        else if (data && data.data && (data.data.message || data.data.content || data.data.text)) {
          message = data.data.message || data.data.content || data.data.text;
        }
        
        if (message) {
          console.log("Extracted message for tip processing:", message);
          
          // Remove introductory and concluding text
          // Look for patterns like "Here are some tips:" or "I hope these tips help!"
          message = message.replace(/^.*?(?:here are|try|following|strategies|tips).*?:/i, '');
          message = message.replace(/(?:I hope|Let me know|Feel free|Hope this helps).*$/i, '');
          
          // Look for tip patterns in the message
          if (message.toLowerCase().includes('tip:') || 
              message.toLowerCase().includes('here\'s a tip') || 
              message.toLowerCase().includes('focus tip') ||
              message.toLowerCase().includes('productivity tip') ||
              message.toLowerCase().includes('suggest') ||
              message.toLowerCase().includes('recommend') ||
              message.toLowerCase().includes('try')) {
            
            // Extract the tip from the message
            let newTip = message;
            
            // Try to extract just the tip part if it follows common patterns
            const tipPatterns = [
              /tip:\s*(.*?)(?:\.|$)/i,
              /here's a tip:\s*(.*?)(?:\.|$)/i,
              /focus tip:\s*(.*?)(?:\.|$)/i,
              /productivity tip:\s*(.*?)(?:\.|$)/i,
              /i suggest\s*(.*?)(?:\.|$)/i,
              /try to\s*(.*?)(?:\.|$)/i,
              /recommend\s*(.*?)(?:\.|$)/i
            ];
            
            for (const pattern of tipPatterns) {
              const match = message.match(pattern);
              if (match && match[1]) {
                newTip = match[1].trim();
                newTip = cleanTipText(newTip);
                console.log("Extracted tip using pattern:", newTip);
                break;
              }
            }
            
            // Add the new tip if it's not already in the list
            setTips(prevTips => {
              if (!prevTips.includes(newTip) && newTip.length > 10) {
                console.log("Adding new tip to list:", newTip);
                // Keep only the most recent 5 tips
                const updatedTips = [newTip, ...prevTips.slice(0, 4)];
                return updatedTips;
              }
              return prevTips;
            });
          }
          
          // Also look for multiple tips in a list format
          const listTipMatches = message.match(/(?:^|\n)[-*•].*?(?:\n|$)/g);
          if (listTipMatches && listTipMatches.length > 0) {
            console.log("Found list-style tips:", listTipMatches);
            const extractedTips = listTipMatches.map(match => {
              // Clean up the tip text completely
              return cleanTipText(match);
            });
            
            // Filter out short tips and add new ones
            const validTips = extractedTips.filter(tip => tip.length > 10);
            if (validTips.length > 0) {
              console.log("Adding valid list tips:", validTips);
              setTips(prevTips => {
                const newTips = [...validTips];
                // Add previous tips until we have 5 total
                for (const oldTip of prevTips) {
                  if (!newTips.includes(oldTip) && newTips.length < 5) {
                    newTips.push(oldTip);
                  }
                }
                return newTips;
              });
            }
          }
        }
      } catch (error) {
        console.error('Error processing chatbot message:', error);
      }
    }
  };
  
  // Function to clean up a single tip text (remove markdown, etc.)
  const cleanTipText = (tip) => {
    if (!tip) return '';
    
    // Remove markdown formatting
    let cleanedTip = tip.trim();
    
    // Remove bullet points and dashes at the beginning
    cleanedTip = cleanedTip.replace(/^[-*•]\s*/, '');
    
    // Remove markdown formatting
    cleanedTip = cleanedTip.replace(/\*\*/g, ''); // Remove bold markers
    cleanedTip = cleanedTip.replace(/\*/g, '');   // Remove italic markers
    cleanedTip = cleanedTip.replace(/__/g, '');   // Remove underline markers
    cleanedTip = cleanedTip.replace(/_/g, '');    // Remove italic markers (alt)
    cleanedTip = cleanedTip.replace(/`/g, '');    // Remove code markers
    
    // Ensure proper ending
    if (!cleanedTip.endsWith('.')) cleanedTip += '.';
    
    return cleanedTip;
  };

  // Function to send the focus profile to the chatbot via postMessage
  const sendProfileToChatbot = (profile) => {
    if (chatbotRef.current && chatbotRef.current.contentWindow) {
      try {
        // Format the profile data for the chatbot
        const profileSummary = `
Please consider my focus profile:
- Preferred Environment: ${profile.preferredEnvironment || 'Not specified'}
- Common Distractions: ${profile.distractions.join(', ') || 'Not specified'}
- Most Productive Hours: ${profile.productiveHours || 'Not specified'}
- Current Focus Challenges: ${profile.currentChallenges || 'Not specified'}

Please use this information to provide personalized focus and productivity advice.
        `.trim();
        
        // Try to communicate with the iframe
        console.log("Sending profile to chatbot via postMessage");
        chatbotRef.current.contentWindow.postMessage({
          type: 'CHATBASE_MESSAGE',
          message: profileSummary
        }, '*'); // Use * instead of 'https://www.chatbase.co' to ensure delivery
      } catch (error) {
        console.error('Error sending profile via postMessage:', error);
      }
    } else {
      console.warn('Chatbot iframe not yet available');
    }
  };

  // Get the chatbot URL with profile data as URL parameters
  const getChatbotUrl = () => {
    // Base URL for the Chatbase iframe
    const baseUrl = "https://www.chatbase.co/chatbot-iframe/DPDJqcjsDY02mmGHs8pVi";
    
    // Only add parameters if we have profile data
    if (Object.values(focusProfile).some(value => 
      value && (Array.isArray(value) ? value.length > 0 : true)
    )) {
      try {
        // Create URL parameters from the focus profile
        const params = new URLSearchParams();
        
        // Add initial message parameter with profile data
        const initialMessage = `
Focus Profile:
- Environment: ${focusProfile.preferredEnvironment || 'Not specified'}
- Distractions: ${focusProfile.distractions.join(',') || 'Not specified'}
- Productive Hours: ${focusProfile.productiveHours || 'Not specified'}
- Challenges: ${focusProfile.currentChallenges || 'Not specified'}
        `.trim();
        
        params.append('initial_message', initialMessage);
        
        // Add individual profile elements as custom parameters
        params.append('env', focusProfile.preferredEnvironment || '');
        params.append('distractions', focusProfile.distractions.join(',') || '');
        params.append('hours', focusProfile.productiveHours || '');
        params.append('challenges', focusProfile.currentChallenges || '');
        
        // Return URL with parameters
        return `${baseUrl}?${params.toString()}`;
      } catch (error) {
        console.error('Error creating chatbot URL:', error);
        return baseUrl;
      }
    }
    
    // Return base URL if no profile data
    return baseUrl;
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name === 'distractions') {
      setFocusProfile({
        ...focusProfile,
        [name]: value.split(',').map(item => item.trim())
      });
    } else {
      setFocusProfile({
        ...focusProfile,
        [name]: value
      });
    }
  };

  const toggleProfileForm = () => {
    setShowProfileForm(!showProfileForm);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    
    // Save to localStorage (already handled by useEffect)
    
    // Reload the iframe with the new profile data
    const iframe = chatbotRef.current;
    if (iframe) {
      iframe.src = getChatbotUrl();
    }
    
    // Show a notification that the profile was saved
    alert('Focus profile saved! Your preferences will be used in future conversations.');
    
    setShowProfileForm(false);
  };
  
  // Function to request focus tips from the chatbot
  const requestFocusTips = () => {
    if (chatbotRef.current && chatbotRef.current.contentWindow) {
      try {
        console.log("Requesting new focus tips from chatbot");
        chatbotRef.current.contentWindow.postMessage({
          type: 'CHATBASE_MESSAGE',
          message: "Can you give me 5 specific focus tips? Please provide them directly without any introduction or conclusion."
        }, '*'); // Use * instead of 'https://www.chatbase.co' to ensure delivery
      } catch (error) {
        console.error('Error requesting focus tips:', error);
      }
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>DeepFocus AI</h1>
        <p>Optimize your workflow and improve your focus</p>
      </header>
      
      <main className="main-content">
        <div className="chat-container">
          <iframe
            ref={chatbotRef}
            src={getChatbotUrl()}
            className="chatbot-iframe"
            title="DeepFocus AI Chatbot"
            onLoad={() => {
              console.log("Chatbot iframe loaded");
              // Wait a moment before attempting to send the profile via postMessage
              setTimeout(() => {
                if (Object.values(focusProfile).some(value => 
                  value && (Array.isArray(value) ? value.length > 0 : true)
                )) {
                  sendProfileToChatbot(focusProfile);
                }
              }, 2000);
            }}
          ></iframe>
        </div>
        
        <div className="sidebar">
          <button className="profile-button" onClick={toggleProfileForm}>
            {showProfileForm ? 'Hide Focus Profile' : 'Update Focus Profile'}
          </button>
          
          {showProfileForm && (
            <form className="profile-form" onSubmit={saveProfile}>
              <h3>Your Focus Profile</h3>
              
              <div className="form-group">
                <label htmlFor="preferredEnvironment">Preferred Work Environment</label>
                <input
                  type="text"
                  id="preferredEnvironment"
                  name="preferredEnvironment"
                  value={focusProfile.preferredEnvironment}
                  onChange={handleProfileChange}
                  placeholder="e.g., quiet room, coffee shop, etc."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="distractions">Common Distractions (comma separated)</label>
                <input
                  type="text"
                  id="distractions"
                  name="distractions"
                  value={focusProfile.distractions.join(', ')}
                  onChange={handleProfileChange}
                  placeholder="e.g., social media, noise, etc."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="productiveHours">Most Productive Hours</label>
                <input
                  type="text"
                  id="productiveHours"
                  name="productiveHours"
                  value={focusProfile.productiveHours}
                  onChange={handleProfileChange}
                  placeholder="e.g., morning, 9-11am, etc."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="currentChallenges">Current Focus Challenges</label>
                <textarea
                  id="currentChallenges"
                  name="currentChallenges"
                  value={focusProfile.currentChallenges}
                  onChange={handleProfileChange}
                  placeholder="Describe what's making it hard to focus..."
                  rows="3"
                ></textarea>
              </div>
              
              <button type="submit" className="save-profile-button">Save Profile</button>
            </form>
          )}
          
          <div className="tips-container">
            <div className="tips-header">
              <h3>Focus Tips</h3>
              <button 
                className="refresh-tips-button" 
                onClick={requestFocusTips}
                title="Get new focus tips from AI"
              >
                ↻
              </button>
            </div>
            <ul className="tips-list">
              {tips.map((tip, index) => (
                <li key={index} className="tip-item">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      
      <footer className="app-footer">
        <p> 2025 DeepFocus AI - Enhance your productivity through deep focus</p>
      </footer>
    </div>
  );
}

export default App;

document.addEventListener('DOMContentLoaded', function () {

  let userID = null;  // Variable to store the user ID
  let isSignedIn = false;

  const initialPopup = document.getElementById('initial-popup');
  const mainPopup = document.getElementById('main-popup');
  const loginPopup = document.getElementById('login-popup');
  const connectButton = document.getElementById('connectButton');
  const submitInitialLoginButton = document.getElementById('submitInitialLogin');
  const submitLoginButton = document.getElementById('submitLogin');
  const cancelLoginButton = document.getElementById('cancelLogin');
  const surveyJunkieEarnings = document.getElementById('surveyJunkieEarnings');
  // Check if user is already signed into Survey Boost
  getFromLocalStorage('userData', function(data) {
    if (data && data.username && data.password) {
      console.log('User data retrieved:', data);
      isSignedIn = true;
      userID = data.userID;

      // Hide initial login popup and show main content
      initialPopup.classList.add('hidden');
      mainPopup.classList.remove('hidden');
    } else {
      console.log("User is not signed in.");
      // Show initial login popup when extension opens
      initialPopup.classList.remove('hidden');
    }
  });
  
  // Show initial login popup when extension opens
  initialPopup.classList.remove('hidden');

  // Handle submitting initial login credentials
  submitInitialLoginButton.addEventListener('click', async function () {
    const username = document.getElementById('surveyBoostUsername').value.trim();
    const password = document.getElementById('surveyBoostPassword').value.trim();

    // Validate username and password input
    if (!username || !password) {
      alert('Please enter both username and password.');
      return;
    }


    try {
      // Perform your submission logic here, e.g., send data to your backend
      const response = await fetch('http://127.0.0.1:8000/api/users/signin/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const responseData = await response.json();

      if (responseData.error) {
        throw new Error(responseData.error || 'Failed to authenticate Survey Boost credentials');
      }
      console.log('Survey Boost credentials authenticated.');

      userID = responseData.user_id;

      saveToLocalStorage('userData', { username, password, userID });

      // Hide initial login popup and show main content
      initialPopup.classList.add('hidden');
      mainPopup.classList.remove('hidden');

    } catch (error) {
      console.error('Error authenticating Survey Boost credentials:', error);
      // Handle error (optional)
      alert("Invalid Username or Password");
    }
  });
  
  getFromLocalStorage('survey_junkie', function(data) {
    if (data && data.email && data.password) {
      console.log('survey junkie data retrieved:', data);
      connectButton.classList.add('hidden');
      surveyJunkieEarnings.classList.remove('hidden');
    } else {
      console.log("User is not signed in to survey junkie.");
      surveyJunkieEarnings.classList.add('hidden');
      connectButton.classList.remove('hidden');
    }
  });

  // Show login popup for Survey Junkie when Connect button is clicked
  connectButton.addEventListener('click', function () {
    mainPopup.classList.add('hidden');
    loginPopup.classList.remove('hidden');
  });

  // Handle canceling login
  cancelLoginButton.addEventListener('click', function () {
    loginPopup.classList.add('hidden');
    mainPopup.classList.remove('hidden');
  });

  // Handle submitting Survey Junkie login credentials
  submitLoginButton.addEventListener('click', async function () {
    const email = document.getElementById('surveyJunkieEmail').value.trim();
    const password = document.getElementById('surveyJunkiePassword').value.trim();

    // Validate email and password input
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }
    console.log("UserID: " + userID, " Email: ", email, " Password: " + password);

    // Run Content Script to see if this is valid credentials on Survey Junkie
    // Get the active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.runtime.sendMessage({
        action: 'login',
        tabId: tab.id,
        email: email,
        password: password
    });

    // Listen for the login success response
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
      if (request.action === 'SurveyJunkie_LoginSuccess') {
          if (request.loginSuccess) {
              (async () => {
                  try {
                      // Perform your submission logic here
                      const response = await fetch('http://127.0.0.1:8000/api/surveys/register/', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                              "user_id": userID,
                              "survey_site": "Survey Junkie",
                              "email": email,
                              "password": password
                          }),
                      });

                      if (!response.ok) {
                          throw new Error('Failed to save Survey Junkie credentials');
                      }

                      console.log('Survey Junkie credentials saved.');

                      saveToLocalStorage('survey_junkie', { email, password, userID });

                      loginPopup.classList.add('hidden');
                      mainPopup.classList.remove('hidden');

                  } catch (error) {
                      console.error('Error saving Survey Junkie credentials:', error);
                      alert('Error saving Survey Junkie credentials. Please try again.');
                  }
              })();
          } 
          else {
              console.log("Login failed, not saving credentials.");
              alert('Login failed. Please check your email and password.');
          }
        }
      });
    });
});

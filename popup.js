let userID = null;

document.addEventListener('DOMContentLoaded', function () {
  // Variable to store the user ID

  const initialPopup = document.getElementById('initial-popup');
  const mainPopup = document.getElementById('main-popup');
  const loginPopup = document.getElementById('surveyJunkie-login-popup');
  const connectButton = document.getElementById('connectButton');
  const submitInitialLoginButton =
    document.getElementById('submitInitialLogin');
  const submitLoginButton = document.getElementById('submitLogin');
  const cancelLoginButton = document.getElementById('cancelLogin');
  const surveyJunkieEarnings = document.getElementById('surveyJunkieEarnings');

  // Elements for Swagbucks
  const swagbucksConnectButton = document.getElementById(
    'swagbucksConnectButton'
  );
  const swagbucksLoginPopup = document.getElementById('swagbucks-login-popup');
  const swagbucksSubmitLoginButton = document.getElementById(
    'swagbucksSubmitLogin'
  );
  const swagbucksCancelLoginButton = document.getElementById(
    'swagbucksCancelLogin'
  );
  const swagbucksEarnings = document.getElementById('swagbucksEarnings');

  // Check if user is already signed into Survey Boost
  getFromLocalStorage('userData', function (data) {
    if (data && data.username && data.password) {
      console.log('User data retrieved:', data);
      userID = data.userID;

      // Hide initial login popup and show main content
      initialPopup.classList.add('hidden');
      mainPopup.classList.remove('hidden');
    } else {
      console.log('User is not signed in.');
      initialPopup.classList.remove('hidden');
    }
  });

  // Handle submitting initial login credentials
  submitInitialLoginButton.addEventListener('click', async function () {
    const username = document
      .getElementById('surveyBoostUsername')
      .value.trim();
    const password = document
      .getElementById('surveyBoostPassword')
      .value.trim();

    if (!username || !password) {
      alert('Please enter both username and password.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/signin/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const responseData = await response.json();

      if (responseData.error) {
        throw new Error(
          responseData.error ||
            'Failed to authenticate Survey Boost credentials'
        );
      }

      console.log('Survey Boost credentials authenticated.');
      userID = responseData.user_id;
      saveToLocalStorage('userData', { username, password, userID });

      initialPopup.classList.add('hidden');
      mainPopup.classList.remove('hidden');
    } catch (error) {
      console.error('Error authenticating Survey Boost credentials:', error);
      alert('Invalid Username or Password');
    }
  });

  // Check Survey Junkie login status
  getFromLocalStorage('survey_junkie', function (data) {
    if (data && data.email && data.password) {
      console.log('Survey Junkie data retrieved:', data);
      connectButton.classList.add('hidden');
      surveyJunkieEarnings.classList.remove('hidden');
    } else {
      console.log('User is not signed in to Survey Junkie.');
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
    const password = document
      .getElementById('surveyJunkiePassword')
      .value.trim();

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.runtime.sendMessage({
      action: 'surveyJunkie_login',
      tabId: tab.id,
      email: email,
      password: password,
    });
  });

  // Check Swagbucks login status
  checkSwagbucksLoginStatus(1);
  // Retrieve the swagbuck balance
  SwagbuckRetrieveAndDisplayBalance();

  // Show login popup for Swagbucks when Connect button is clicked
  swagbucksConnectButton.addEventListener('click', function () {
    mainPopup.classList.add('hidden');
    swagbucksLoginPopup.classList.remove('hidden');
  });

  // Handle canceling Swagbucks login
  swagbucksCancelLoginButton.addEventListener('click', function () {
    swagbucksLoginPopup.classList.add('hidden');
    mainPopup.classList.remove('hidden');
  });

  // Handle submitting Swagbucks login credentials
  swagbucksSubmitLoginButton.addEventListener('click', async function () {
    const email = document.getElementById('swagbucksEmail').value.trim();
    const password = document.getElementById('swagbucksPassword').value.trim();

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.runtime.sendMessage({
      action: 'swagbucks_login',
      tabId: tab.id,
      user_id: userID,
      email: email,
      password: password,
    });
  });
});

/**************************************************************************************************************/

async function checkSwagbucksLoginStatus(userID) {
  if (!userID) {
    console.error('No valid userID provided');
    return;
  }
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/surveys/user/?user_id=${userID}&survey_site=Swag_Bucks`,
      { method: 'GET' }
    );

    if (!response.ok) {
      // Fetch the response text to diagnose the issue
      const errorText = await response.text();
      throw new Error(
        `Network response was not ok: ${response.statusText}. ${errorText}`
      );
    }

    const data = await response.json();

    if (data && data.email && data.password) {
      console.log('Swagbucks data retrieved:', data);
      swagbucksConnectButton.classList.add('hidden');
      swagbucksEarnings.classList.remove('hidden');
    } else {
      console.log('User is not signed in to Swagbucks.');
      swagbucksEarnings.classList.add('hidden');
      swagbucksConnectButton.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error checking Swagbucks login status:', error);
    swagbucksEarnings.classList.add('hidden');
    swagbucksConnectButton.classList.remove('hidden');
  }
}
async function SwagbuckRetrieveAndDisplayBalance() {
  const swagbucksEarnings = document.getElementById('swagbucksEarnings');
  let user_id = 1; // Test
  let survey_site = 'Swag_Bucks'; // Ensure this matches what you need

  if (swagbucksEarnings) {
    chrome.storage.local.get(['swagbuck_balance'], async (result) => {
      if (result.swagbuck_balance) {
        const { balanceText, rawBalance } = result.swagbuck_balance;
        const balance = parseInt(rawBalance, 10); // Ensure balance is an integer

        // Display the balanceText in the UI
        swagbucksEarnings.textContent = `Earnings: ${balanceText}`;

        try {
          console.log('Attempting to save credentials...');
          console.log('Type of balance:', typeof balance);

          const response = await fetch(
            `http://127.0.0.1:8000/api/surveys/update_balance/?user_id=${user_id}&survey_site=${encodeURIComponent(
              survey_site
            )}&balance=${balance}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              // No need for a body since we are using query parameters
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Failed to save Swagbucks Earnings: ${response.statusText} - ${errorText}`
            );
          }

          console.log('Swagbucks Earnings saved.');
        } catch (error) {
          console.error('Error saving Swagbucks Earnings:', error);
          // Optionally, notify the user about the error
        }
      } else {
        swagbucksEarnings.textContent = 'Earnings: Not available';
      }
    });
  } else {
    console.error('Element with ID "swagbucksEarnings" not found.');
  }
}

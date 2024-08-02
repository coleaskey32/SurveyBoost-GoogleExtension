chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'surveyJunkie_login') {
    try {
      const newTab = await chrome.tabs.create({
        url: 'https://app.surveyjunkie.com/public/signin',
      });

      chrome.tabs.onUpdated.addListener(function onUpdated(tabId, changeInfo) {
        if (tabId === newTab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(onUpdated);

          chrome.scripting
            .executeScript({
              target: { tabId: newTab.id },
              func: executeLogin_SurveyJunkie,
              args: [request.email, request.password],
            })
            .then((results) => {
              if (results && results[0] && results[0].result) {
                const loginSuccess = results[0].result;
                handleLoginResult_SurveyJunkie(loginSuccess, request);
              } else {
                console.error('No results or login failed.');
              }
            })
            .catch((err) => {
              console.error('Failed to execute script:', err);
            });
        }
      });
    } catch (err) {
      console.error(`Failed to create tab or execute script: ${err}`);
    }
  }

  if (request.action === 'swagbucks_login') {
    try {
      // Create a new tab with the Swagbucks login page
      const loginTab = await chrome.tabs.create({
        url: 'https://www.swagbucks.com/p/login',
      });

      chrome.webNavigation.onCompleted.addListener(
        function onLoginPageLoaded(details) {
          if (
            details.tabId === loginTab.id &&
            details.url.includes('/p/login')
          ) {
            chrome.webNavigation.onCompleted.removeListener(onLoginPageLoaded);

            console.log('Swagbucks login page loaded');

            // Inject content script for login
            chrome.scripting
              .executeScript({
                target: { tabId: loginTab.id },
                files: ['content-swagbuck.js'],
              })
              .then(() => {
                console.log('Content script injected for login');

                // Send a message to perform login
                chrome.tabs.sendMessage(loginTab.id, {
                  action: 'swagbuck_login',
                  email: request.email,
                  password: request.password,
                });
              })
              .catch((err) => {
                console.error('Failed to inject content script:', err);
              });
          }
        },
        { url: [{ urlMatches: 'https://www.swagbucks.com/p/login' }] }
      );

      chrome.webNavigation.onCompleted.addListener(
        function onHomepageLoaded(details) {
          if (
            details.tabId === loginTab.id &&
            details.url === 'https://www.swagbucks.com/'
          ) {
            chrome.webNavigation.onCompleted.removeListener(onHomepageLoaded);

            console.log('Swagbucks homepage loaded');

            // Inject content script for homepage check
            chrome.scripting
              .executeScript({
                target: { tabId: details.tabId },
                files: ['content-swagbuck.js'],
              })
              .then(() => {
                console.log(
                  'Content script injected for homepage check and userID is ',
                  request.userID
                );
                // Send a message to check homepage
                chrome.tabs.sendMessage(details.tabId, {
                  action: 'check_homepage',
                  user_id: request.user_id,
                  email: request.email,
                  password: request.password,
                });
              })
              .catch((err) => {
                console.error(
                  'Failed to inject content script for homepage check:',
                  err
                );
              });
          }
        },
        { url: [{ urlMatches: 'https://www.swagbucks.com/' }] }
      );
    } catch (err) {
      console.error('Failed to handle Swagbucks login:', err);
    }
  }

  /********************************* Listen for messages from content scripts *********************************/

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'swagbuck_updateBalance') {
      const balance = message.balance;
      const surveySite = 'Swag Bucks';

      if (balance) {
        // Retrieve userID from local storage
        getFromLocalStorage('userData', (userData) => {
          if (userData && userData.userID) {
            const userID = userData.userID;

            console.log('Swagbucks balance received:', balance);

            // Update balance on the server
            fetch('http://127.0.0.1:8000/api/surveys/update_balance/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: userID,
                survey_site: surveySite,
                balance: balance,
              }),
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.message) {
                  console.log(data.message); // Log success message from server
                } else if (data.error) {
                  console.error('Error updating balance:', data.error);
                }
              })
              .catch((error) => {
                console.error('Error making API request:', error);
              });

            // Optional: Update the UI in popup or other parts of the extension
            chrome.runtime.sendMessage({
              action: 'updateUI',
              balance: balance,
            });
          } else {
            console.error('UserID not found in local storage');
          }
        });
      } else {
        console.error('Failed to retrieve balance');
      }
    }
  });

  if (
    request.from === 'content-swagbuck' &&
    (request.action === 'home-check' || request.action === 'swagbuck_login')
  ) {
    console.log('Homepage check result received:', request.loginSuccess);
    console.log('content script sent:', request);

    // Call the handleLoginResult_SwagBucks function with the login result
    handleLoginResult_SwagBucks(request);
  }
});

/******************************************************************/

// Wait until the page is fully loaded before executing script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log(tab.url.includes);
  if (tab.url && tab.url.includes('swagbucks.com')) {
    console.log('INJECTED');
    // Inject the content script into the tab
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ['content-swagbuck.js'],
      },
      () => {
        // Send a message to the content script once it’s injected
        chrome.tabs.sendMessage(tabId, { action: 'swagbuck-getBalance' });
      }
    );
  }
});

function executeLogin_SurveyJunkie(email, password) {
  return new Promise((resolve) => {
    const setInputValue = (field, value) => {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const emailField = document.querySelector(
      'input[aria-label="Email address"]'
    );
    const passwordField = document.querySelector('input[type="password"]');
    const loginButton = document.querySelector('button.sc-1saobic-0.fawTDA');

    if (emailField && passwordField) {
      setInputValue(emailField, email);

      setTimeout(() => {
        setInputValue(passwordField, password);

        setTimeout(() => {
          if (loginButton && !loginButton.disabled) {
            loginButton.click();

            setTimeout(() => {
              const errorMessage = document.querySelector(
                '.sc-1u6odhl-4.iATHoB'
              );

              if (errorMessage) {
                console.error('Login failed: ' + errorMessage.textContent);
                resolve(false);
              } else {
                console.log('Login successful or no error message displayed.');
                resolve(true);
              }
            }, 1000); // Adjust the delay as needed
          } else {
            console.error('Login button is disabled.');
            resolve(false);
          }
        }, 100); // Adjust as needed
      }, 100); // Adjust as needed
    } else {
      resolve(false);
    }
  });
}

/*********************************************************************/

async function handleLoginResult_SurveyJunkie(loginSuccess, request) {
  console.log('Login result: ', loginSuccess);
  console.log(request.email, request.password, request.user_id);
  if (loginSuccess) {
    try {
      console.log('Attempting to save credentials...');
      const response = await fetch(
        'http://127.0.0.1:8000/api/surveys/register/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: request.user_id,
            survey_site: 'Survey Junkie',
            email: request.email,
            password: request.password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save Survey Junkie credentials');
      }

      console.log('Survey Junkie credentials saved.');
    } catch (error) {
      console.error('Error saving Survey Junkie credentials:', error);
      // Optionally, notify the user about the error
    }
  } else {
    console.log('Login failed, not saving credentials.');
    // Optionally, notify the user about the login failure
  }
}

/*********************************************************************/

async function handleLoginResult_SwagBucks(request) {
  console.log('Login result: ', request);
  if (request.loginSuccess) {
    try {
      console.log('Attempting to save credentials...');
      const response = await fetch(
        'http://127.0.0.1:8000/api/surveys/register/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: request.user_id,
            survey_site: 'Swag_Bucks',
            email: request.email,
            password: request.password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save Swag Bucks credentials');
      }

      console.log('Swag Bucks credentials saved.');
    } catch (error) {
      console.error('Error saving Swag Bucks credentials:', error);
      // Optionally, notify the user about the error
    }
  } else {
    console.log('Login failed, not saving credentials.');
    // Optionally, notify the user about the login failure
  }
}

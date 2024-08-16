
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

  if (request.action === 'brandedsurvey_login') {
    try {

      // Create a new tab with the Swagbucks login page
      const loginTab = await chrome.tabs.create({
        url: 'https://surveys.gobranded.com/users/login/',
      });

      chrome.webNavigation.onCompleted.addListener(
        function onLoginPageLoaded(details) {
          if (
            details.tabId === loginTab.id &&
            details.url.includes('/users/login/')
          ) {
            chrome.webNavigation.onCompleted.removeListener(onLoginPageLoaded);

            console.log('Branded Surveys login page loaded');

            // Inject content script for login
            chrome.scripting
              .executeScript({
                target: { tabId: loginTab.id },
                files: ['content-brandedsurvey.js'],
              })
              .then(() => {
                console.log('Content script injected for login');

                // Send a message to perform login
                chrome.tabs.sendMessage(loginTab.id, {
                  action: 'brandedsurveys_login',
                  email: request.email,
                  password: request.password,
                });
              })
              .catch((err) => {
                console.error('Failed to inject content script:', err);
              });
          }
        },
        { url: [{ urlMatches: 'https://surveys.gobranded.com/users/login/' }] }
      );

      chrome.webNavigation.onCompleted.addListener(
        function onHomepageLoaded(details) {
          if (
            details.tabId === loginTab.id &&
            details.url === 'https://surveys.gobranded.com/users/dashboard'
          ) {
            chrome.webNavigation.onCompleted.removeListener(onHomepageLoaded);

            console.log('branded Surveys homepage loaded');

            // Inject content script for homepage check
            chrome.scripting
              .executeScript({
                target: { tabId: details.tabId },
                files: ['content-brandedsurvey.js'],
              })
              .then(() => {
                console.log(
                  'Content script injected for homepage check and userID is ',
                  request.userID
                );
                // Send a message to check homepage
                chrome.tabs.sendMessage(details.tabId, {
                  action: 'brandedsurveys_check_homepage',
                  user_id: request.user_id,
                  email: request.email,
                  password: request.password,
                });
              })
              .catch((err) => {
                console.error(
                  'Failed to inject content script for Branded Surveys homepage check:',
                  err
                );
              });
          }
        },
        { url: [{ urlMatches: 'https://surveys.gobranded.com/users/dashboard' }] }
      );
    } catch (err) {
      console.error('Failed to handle Branded Surveys login:', err);
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

  if (
    request.from === 'content-brandedsurvey' &&
    (request.action === 'home-check' || request.action === 'brandedsurvey_login')
  ) {
    console.log('Homepage check result received:', request.loginSuccess);
    console.log('content script sent:', request);

    // Call the handleLoginResult_brandedSurvey function with the login result
    handleLoginResult_brandedSurvey(request);
  }

});

/******************************************************************/

// Wait until the page is fully loaded before executing script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("updating survey branded balance ")
  if (tab.url && tab.url.includes('https://surveys.gobranded.com/users/dashboard')) {

    // Inject the content script into the tab
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ['content-brandedsurvey.js'],
      },
      () => {
        // Send a message to the content script once it’s injected
        chrome.tabs.sendMessage(tabId, { action: 'brandedsurveys-getBalance' });
      }
    );
  }
});

// Wait until the page is fully loaded before executing script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  if (tab.url && tab.url.includes('swagbucks.com')) {

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

async function handleLoginResult_brandedSurvey(request) {
  console.log('Login result: ', request);
  if (request.loginSuccess) {
    try {
      console.log('Attempting to save credentials for Branded Survey...');
      const response = await fetch(
        'http://127.0.0.1:8000/api/surveys/register/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: request.user_id,
            survey_site: 'Branded_Survey',
            email: request.email,
            password: request.password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save Branded Survey credentials');
      }

      console.log('Branded Survey credentials saved.');
    } catch (error) {
      console.error('Error saving Branded Survey credentials:', error);
      // Optionally, notify the user about the error
    }
  } else {
    console.log('Login failed, not saving credentials.');
    // Optionally, notify the user about the login failure
  }
}

/********************************************* Survey *****************************************************************/

// Define a local variable for the queue
let queue = 2; // Initialize the queue with a default value

// Survey site data adding more in the future 
const surveySites = [
    {
        name: "Branded_Survey",
        url: "https://surveys.gobranded.com/users/dashboard",
        file: "content-brandedsurvey.js"
    }
];

const survey = [
  {
    id: '1',
    running: false,
    url: "",
    file: ""
  },
  {
    id: '2',
    running: false,
    url: "",
    file: ""
  }
];

// Periodically check for updates
const startLongPolling = () => {
    setInterval(async () => {
        await checkStartSurvey();
    }, 10000); // Poll every 10 seconds
};

const checkStartSurvey = async () => {
    // Retrieve user data
    chrome.storage.local.get(['userData'], async (storageData) => {
        if (chrome.runtime.lastError) {
            console.error('Error retrieving data from storage:', chrome.runtime.lastError);
            return;
        }

        const user_id = storageData.userData?.userID;

        // If queue is 0, no surveys should be started
        if (queue === 0) {
            console.log('Queue is empty, no surveys to start.');
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/surveys/startsurvey/?user_id=${user_id}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const responseData = await response.json();

            if (Array.isArray(responseData.data) && responseData.data.length > 0) {
                // Filter the survey sites that are eligible to start
                const eligibleSurveys = responseData.data.filter(surveyData => surveyData.start_survey === true);

                if (eligibleSurveys.length > 0) {
                    // Randomly select one of the eligible surveys
                    const randomIndex = Math.floor(Math.random() * eligibleSurveys.length);
                    const selectedSurveyData = eligibleSurveys[randomIndex];
                    const selectedSurveySite = surveySites.find(site => site.name === selectedSurveyData.survey_site);

                    // Start the survey for the selected site
                    if (selectedSurveySite) {
                        startSurveyTemp(selectedSurveySite, user_id);
                        // if survey.id === 1 and survey.running === true and not survey 2 
                        //getAnswer(survey2) with some sort of long pooling 
                        // Decrement the queue count
                        queue -= 1;
                        console.log('Queue decremented. New queue value:', queue);
                    } else {
                        console.error(`No survey site found with id ${selectedSurveyData.site_id}`);
                    }
                } else {
                    console.log('No surveys with start_survey set to true.');
                }
            } else {
                console.error('No valid data received:', responseData);
            }
        } catch (error) {
            console.error('Error fetching survey start data:', error);
        }
    });
};

const startSurveyTemp = (surveySite, user_id) => {
    // Create the new tab at the selected survey site
    chrome.tabs.create({ url: surveySite.url }, (tab) => {
        console.log(`New tab created for ${surveySite.name} with ID:`, tab.id);

        // Inject the script into the tab
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [surveySite.file]
        }, () => {

          if (chrome.runtime.lastError) {
            console.error('Error injecting script:', chrome.runtime.lastError);
          } 
          else {
            console.log("Sending the message...");
            // Send parameters to the script
            chrome.tabs.sendMessage(tab.id, {
              action: 'start_survey',
              number: 1,
              email: surveyData.email,
              password: surveyData.password
            });
          }
        });     
    });
};

// Listener for question information from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'brandedsurvey_surveyData') {
        chrome.storage.local.get(['userData'], (data) => {
            if (chrome.runtime.lastError) {
                console.error('Error retrieving data from storage:', chrome.runtime.lastError);
                return;
            }

            const user_id = data.userData ? data.userData.userID : 0;

            console.log('Received survey data:', message);

            const transformedQuestions = message.data.map((question, index) => ({
                question_id: question.id,
                question_type: question.type,
                question_text: question.text,
                options: question.options ? question.options.map(option => ({
                    value: option.value,
                    label: option.label
                })) : [],
                answer: question.answer
            }));

            const payload = {
                questions: transformedQuestions,
                survey_number: message.number,
                user_id: user_id
            };

            fetch('http://127.0.0.1:8000/api/surveys/brandedSurveyQuestion/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => console.log('Survey data successfully sent:', data))
            .catch(error => console.error('Error sending survey data:', error));
        });
    }
});

chrome.runtime.onInstalled.addListener(() => {
    startLongPolling();
});

chrome.runtime.onStartup.addListener(() => {
    startLongPolling();
});


// For Reference 
const StartSurvey = () => {
  chrome.storage.local.get(['userData', 'queue'], (data) => {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving data from storage:', chrome.runtime.lastError);
      return;
    }

    if (data && data.userData && data.userData.userID) {
      const user_id = data.userData.userID;
      const queue = data.queue || 0;

      if (queue > 0) {
        fetch(`http://127.0.0.1:8000/api/surveys/startsurvey/?user_id=${user_id}`)
          .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok'))
          .then(responseData => {
              if (Array.isArray(responseData.data) && responseData.data.length > 0) {
                const surveyData = responseData.data[0];
                if (surveyData.start_survey === true) {
                  
                  console.log("Starting survey...");
                  
                  // Get the active tab
                  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    const tab = tabs[0];

                    if (tab) {
                      // Update the tab URL
                      chrome.tabs.update(tab.id, { url: 'https://surveys.gobranded.com/users/dashboard' }, () => {
                        
                        // Inject the script into the tab
                        chrome.scripting.executeScript({
                          target: { tabId: tab.id },
                          files: ['content-brandedsurvey.js']
                        }, () => {
                          if (chrome.runtime.lastError) {
                            console.error('Error injecting script:', chrome.runtime.lastError);
                          } else {
                            console.log("Sending the message...");
                            // Send parameters to the script
                            chrome.tabs.sendMessage(tab.id, {
                              action: 'start_survey',
                              number: 1,
                              email: surveyData.email,
                              password: surveyData.password
                            });
                          }
                        });
                      });

                      // Decrement the queue
                      chrome.storage.local.set({ queue: queue - 1 }, () => {
                        if (chrome.runtime.lastError) {
                          console.error('Error updating queue in storage:', chrome.runtime.lastError);
                        }
                      });
                    } else {
                      console.error('No active tab found.');
                    }
                  });
                } else {
                  console.error('Survey data start_survey is not true.');
                }
              } else {
                console.error('Survey data is not available or is invalid.');
              }
          })
          .catch(error => {
            console.error('Error fetching survey data:', error);
          });
      } else {
        console.log('Queue is empty. No surveys will be started.');
      }
    } else {
      console.error('User data or userID not found in storage.');
    }
  });
};
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'login') {
      try {
          const newTab = await chrome.tabs.create({ url: "https://app.surveyjunkie.com/public/signin" });

          chrome.tabs.onUpdated.addListener(function onUpdated(tabId, changeInfo) {
              if (tabId === newTab.id && changeInfo.status === 'complete') {
                  chrome.tabs.onUpdated.removeListener(onUpdated);

                  chrome.scripting.executeScript({
                      target: { tabId: newTab.id },
                      files: ['content.js']
                  }, () => {
                      chrome.scripting.executeScript({
                          target: { tabId: newTab.id },
                          func: (email, password) => {
                              const setInputValue = (field, value) => {
                                  field.value = value;
                                  field.dispatchEvent(new Event('input', { bubbles: true }));
                                  field.dispatchEvent(new Event('change', { bubbles: true }));
                              };

                              const loginToSurveyJunkie = (email, password) => {
                                  const emailField = document.querySelector('input[aria-label="Email address"]');
                                  const passwordField = document.querySelector('input[type="password"]');
                                  const loginButton = document.querySelector('button.sc-1saobic-0.fawTDA');

                                  if (emailField && passwordField) {
                                      setInputValue(emailField, email);

                                      setTimeout(() => {
                                        setInputValue(passwordField, password);
                            
                                        setTimeout(() => {
                                            if (loginButton && !loginButton.disabled) {
                                                loginButton.click();
                            
                                                // Check for error message after clicking login
                                                setTimeout(() => {
                                                    const errorMessage = document.querySelector('.sc-1u6odhl-4.iATHoB'); // Your error message selector

                                                    if (errorMessage) {
                                                        console.error("Login failed: " + errorMessage.textContent);
                                                        sendResponse({ action: 'SurveyJunkie_LoginSuccess', loginSuccess: false });
                                                    } 
                                                    else {
                                                        console.log("Login successful or no error message displayed.");
                                                        chrome.runtime.sendMessage({ action: 'SurveyJunkie_LoginSuccess', loginSuccess: true });
                                                    }
                                                }, 1000); // Adjust the delay as needed
                                            } else {
                                                console.error("Login button is disabled.");
                                            }
                                        }, 100); // Adjust as needed
                                      }, 100); // Adjust as needed
                                  }
                              };

                              loginToSurveyJunkie(email, password);
                          },
                          args: [request.email, request.password]
                      });
                  });
              }
          });
      } catch (err) {
          console.error(`Failed to create tab or execute script: ${err}`);
      }
  }
});

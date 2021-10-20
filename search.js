const https = require('https');
const html = require('node-html-parser');

const EACH_PAGE_RESULTS_COUNT = 10;
const SLEEP_MS = 2500;

exports.google = (searchTerm, pagesCount, stepCallback) => {
    return new Promise(async (resolve, reject) => {
        if (searchTerm === undefined || pagesCount === undefined || stepCallback === undefined)
        {
            reject("Not enough arguments provided to the function.");
            return;
        }

        if (!(typeof pagesCount == "number" && typeof stepCallback == "function"))
        {
            reject("Wrong arguments provided. Please check arguments types.");
            return;
        }

        const resultsObj = [];
        let finishIndex = 0;

        searchTerm = escape(searchTerm);
        let finish = false;
        for (let index = 0; index <= pagesCount && !finish; index += EACH_PAGE_RESULTS_COUNT)
        {
            let options = {
                host: "www.google.com",
                path: "/search?q=" + searchTerm + "&start=" + index,
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; yeaboi/2.1;)",
                    'Cookie': "CONSENT=YES+1"
                }
            }

            https.request(options, (res) => {

                let currentPageResults = [];
                let data = ""
                res.on("data", (chunk) => {
                    data += chunk;
                })

                res.on("end", () => {
                    const root = html.parse(data);
                    const resultsHtml = root.querySelectorAll("#main .ZINbbc .kCrYT")

                    resultsHtml.forEach(htmlEntry => {
                        let urlHtml = htmlEntry.querySelector("a");
                        let descriptionHtml = htmlEntry.querySelector(".vvjwJb");

                        if (urlHtml != null && descriptionHtml != null)
                        {
                            let url = urlHtml.getAttribute("href");

                            // Fix for URLs being tracked with search ID or similar
                            url = url.replace(/\/url\?q=/g, "")
                            url = url.substring(0, url.indexOf("&sa="))

                            // Fix for GoogleBooks URLs being tracked with search ID or similar
                            if (url.includes("books.google."))
                                url = url.substring(0, url.indexOf("&pg="))

                            let obj = {
                                url: url,
                                description: descriptionHtml.innerText
                            };
                            if (!resultsObj.some(t => t['url'] === obj['url']))
                            {
                                currentPageResults.push(obj);
                                resultsObj.push(obj);
                            }
                        }
                    });

                    stepCallback(currentPageResults, `Waiting ${SLEEP_MS}ms for the next page. Current page: ${index / 10}, Found data: ${resultsObj.length}`)

                    finishIndex += EACH_PAGE_RESULTS_COUNT;
                    if (currentPageResults.length === 0 || finishIndex > pagesCount)
                    {
                        finish = true;
                        resolve(resultsObj)
                    }
                })
            }).end();
            await sleep(SLEEP_MS);
        }
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
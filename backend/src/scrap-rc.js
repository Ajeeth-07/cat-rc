const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { Essay } = require("./db"); // Add this import
// Base URL
const baseUrl = "https://aeon.co";
const essaysUrl = `${baseUrl}/essays`;

// Function to get all essay links from the main page, including "load more" content
async function getEssayLinks(maxPages = 10) {
  try {
    let allLinks = [];
    let page = 1;
    let hasMorePages = true;

    console.log("Fetching essay links from all pages...");

    while (hasMorePages && page <= maxPages) {
      console.log(`Fetching page ${page}...`);

      // For the first page, use the regular URL, for subsequent pages use the page parameter
      const url = page === 1 ? essaysUrl : `${essaysUrl}?page=${page}`;

      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Find all essay links on the current page
      const pageLinks = [];
      $('a[href^="/essays/"]').each((i, el) => {
        const link = $(el).attr("href");
        if (
          link &&
          link !== "/essays" &&
          link !== "/essays/popular" &&
          !link.includes("?page=")
        ) {
          pageLinks.push(link);
        }
      });

      // If we found no new links or the same number as before, assume we've reached the end
      if (pageLinks.length === 0) {
        hasMorePages = false;
      } else {
        allLinks = [...allLinks, ...pageLinks];
        page++;

        // Add a small delay between page requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Return unique links
    return [...new Set(allLinks)].map((link) => `${baseUrl}${link}`);
  } catch (error) {
    console.error("Error fetching essay links:", error.message);
    return [];
  }
}

// Function to scrape content from a single essay
async function scrapeEssay(url) {
  try {
    console.log(`Scraping essay: ${url}`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Get the title from the specific class you mentioned
    const title = $(
      "p.m-x-0.mt-3\\.5.mb-3.font-bold.font-serif.text-\\[25px\\].leading-\\[1\\.2\\].\\[grid-area\\:title\\].sm\\:text-\\[28px\\], h1"
    )
      .first()
      .text()
      .trim();

    // Get the author with the specific class you mentioned
    // const author = $(".sc-c0f26063-0.sc-c0f26063-8.kkFuen.hEQNLv")
    //   .first()
    //   .text()
    //   .trim();

    // Get the category - look in the parent div you mentioned class="sc-c0f26063-2 giKPKU font-mono peer-hover:hidden"
    let category = "";
    $("p.sc-c0f26063-2.giKPKU.font-mono.peer-hover\\:hidden").each((i, el) => {
      const text = $(el).text().trim();
      if (text) {
        category = text;
        return false; // break the loop once we find a category
      }
    });

    // Get the content from the div with the specified class
    const contentDiv = $('div[class*="lclXep"], div.has-dropcap');

    // Extract all paragraphs from the content div
    let content = "";
    contentDiv.find("p").each((i, el) => {
      content += $(el).text() + "\n\n";
    });

    // Get the publication date if available
    const publishedDate = $("time").attr("datetime") || "";

    // Fallback methods if primary selectors fail
    let finalTitle = title || $("h1").first().text().trim();
    // let finalAuthor = author || $(".author-name").first().text().trim();

    // Additional fallback for author - sometimes it might be in a different element
    // if (!finalAuthor) {
    //   $('a[href^="/contributors/"]').each((i, el) => {
    //     finalAuthor = $(el).text().trim();
    //     if (finalAuthor) return false; // break once we find something
    //   });
    // }

    let finalWords;

    function countWords() {
      finalWords = content.trim().split(/\s+/).length;
    }
    countWords();
    return {
      title: finalTitle,
      //   author: finalAuthor,
      category,
      url,
      publishedDate,
      content,
      scrapedDate: new Date().toISOString(),
      wordCount: finalWords,
    };
  } catch (error) {
    console.error(`Error scraping essay ${url}:`, error.message);
    return null;
  }
}

// Function to save essays to JSON file
function saveEssays(essays, filename = "aeon_essays.json") {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, JSON.stringify(essays, null, 2));
  console.log(`Saved ${essays.length} essays to ${filePath}`);
}

// Main function
async function main() {
  try {
    const links = await getEssayLinks(5);
    console.log(`Found ${links.length} essay links`);

    const targetLinks = links;
    let count = 0;

    for (const link of targetLinks) {
      try {
        const essay = await scrapeEssay(link);
        if (essay) {
          // Check if essay already exists
          const existingEssay = await Essay.findOne({
            $or: [{ title: essay.title }, { url: essay.url }],
          });

          if (!existingEssay) {
            // Save to MongoDB
            await Essay.create({
              title: essay.title,
              url: essay.url,
              category: essay.category,
              content: essay.content,
              publishedDate: essay.publishedDate,
              scrappedDate: essay.scrapedDate,
              wordCount: essay.wordCount,
            });
            count++;
            console.log(`Added essay: ${essay.title}`);
          } else {
            console.log(`Skipping duplicate essay: ${essay.title}`);
          }
        }

        // Log progress
        if (count % 10 === 0) {
          console.log(
            `Progress: ${count}/${targetLinks.length} essays added to DB`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`Error processing essay ${link}:`, error.message);
        continue; // Continue with next essay if one fails
      }
    }

    console.log(`Scraping completed! Added ${count} new essays to database.`);
  } catch (error) {
    console.error("Error in main function:", error.message);
  }
}

// Run the main function
main();

module.exports ={
  essaysUrl,scrapeEssay
}
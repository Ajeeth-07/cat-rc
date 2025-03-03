const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

// Base URL
const baseUrl = "https://aeon.co";
const essaysUrl = `${baseUrl}/essays`;

// Function to get all essay links from the main page
async function getEssayLinks() {
  try {
    console.log("Fetching essay links from the main page...");
    const response = await axios.get(essaysUrl);
    const $ = cheerio.load(response.data);

    // Find all essay links
    const links = [];
    $('a[href^="/essays/"]').each((i, el) => {
      const link = $(el).attr("href");
      if (link && !links.includes(link) && link !== "/essays") {
        links.push(link);
      }
    });

    // Return unique links
    return [...new Set(links)].map((link) => `${baseUrl}${link}`);
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

    // Get the title
    const title = $("h1").first().text().trim();

    // Get the author
    const author = $(".author-name").first().text().trim();

    // Get the content from the div with the specified class
    // Note: Class names might change, so we're using a more flexible approach
    const contentDiv = $('div[class*="lclXep"], div.has-dropcap');

    // Extract all paragraphs from the content div
    let content = "";
    contentDiv.find("p").each((i, el) => {
      content += $(el).text() + "\n\n";
    });

    return {
      title,
      author,
      url,
      content,
      date: new Date().toISOString(),
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
    // Get all essay links
    const links = await getEssayLinks();
    console.log(`Found ${links.length} essay links`);

    // For testing, limit to first 5 essays
    const testLinks = links.slice(0, 5);

    // Scrape each essay
    const essays = [];
    for (const link of testLinks) {
      const essay = await scrapeEssay(link);
      if (essay) {
        essays.push(essay);
      }

      // Add a small delay to avoid overloading the server
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Save essays to file
    saveEssays(essays);

    console.log("Scraping completed successfully!");
  } catch (error) {
    console.error("Error in main function:", error.message);
  }
}

// Run the main function
main();
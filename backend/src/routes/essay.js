const express = require("express");
const router = express.Router();
const { Essay } = require("../db");
const path = require("path");
const { getEssayLinks, scrapeEssay } = require("../scrap-rc"); // Import the scraping functions

router.post("/essays", async (req, res) => {
  try {
    const {
      title,
      url,
      category,
      content,
      publishedDate,
      scrappedDate,
      wordCount,
    } = req.body;

    const existingTitle = await Essay.findOne({ title });
    const existingUrl = await Essay.findOne({ url });

    if (existingTitle)
      return res
        .status(411)
        .json({ msg: "Essay already exists with the title" });
    if (existingUrl)
      return res.status(411).json({ msg: "Essay already exists" });

    const newEssay = await Essay.create({
      title,
      url,
      category,
      content,
      publishedDate,
      scrappedDate,
      wordCount,
    });

    res.status(200).json({ msg: "Essay added to db" });
  } catch (err) {
    console.error(err);
  }
});

router.post("/scrape", async (req, res) => {
  try {
    const maxPages = req.body.maxPages || 5;

    // Start scraping asynchronously
    res.status(200).json({ message: "Scraping started" });

    // Execute scraping in the background
    scrapeAndSaveEssays(maxPages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function scrapeAndSaveEssays(maxPages) {
  try {
    const links = await getEssayLinks(maxPages);
    console.log(`Found ${links.length} essay links`);

    let count = 0;
    for (const link of links) {
      try {
        const essay = await scrapeEssay(link);
        if (essay) {
          const existingEssay = await Essay.findOne({
            $or: [{ title: essay.title }, { url: essay.url }],
          });

          if (!existingEssay) {
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

        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`Error processing essay ${link}:`, error.message);
      }
    }
    console.log(`Scraping completed! Added ${count} new essays to database.`);
  } catch (error) {
    console.error("Error in scraping:", error.message);
  }
}

module.exports = router;

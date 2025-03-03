require("dotenv").config();
const mongoose = require("mongoose");
const { Essay } = require("../db");

// Test essay with approximately 3000 words
const testEssay = {
  title: "The Future of Artificial Intelligence: Promises and Perils",
  url: "https://example.com/ai-future",
  category: "Technology",
  content: `Artificial Intelligence (AI) stands at the frontier of technological innovation, promising to reshape human civilization in profound and far-reaching ways. As we venture deeper into the 21st century, the development of increasingly sophisticated AI systems raises fundamental questions about the future relationship between humans and machines, the nature of intelligence and consciousness, and the very fabric of our social, economic, and political systems. This essay explores the multifaceted landscape of AI's potential, examining both its transformative promises and its concerning perils.

The evolution of AI has been marked by significant milestones, from the theoretical foundations laid by Alan Turing and John McCarthy to the recent breakthroughs in deep learning and neural networks. Early AI systems were rule-based and limited in scope, capable of performing only narrowly defined tasks. Today's AI systems, however, demonstrate remarkable capabilities in areas once thought to be exclusively human domains – language processing, pattern recognition, strategic decision-making, and even creative expression. This rapid advancement shows no signs of slowing, with researchers continually pushing the boundaries of what machines can accomplish.

One of the most promising aspects of AI lies in its potential to solve complex global challenges. In healthcare, AI systems are already assisting in disease diagnosis, drug discovery, and personalized treatment plans. Machine learning algorithms can detect patterns in medical images that might escape even the most experienced human practitioners, potentially saving countless lives through early and accurate diagnosis. In climate science, AI models help predict environmental changes, optimize renewable energy systems, and develop more sustainable industrial processes. The computational power of AI enables researchers to process vast datasets and identify solutions to problems that might otherwise remain intractable.

Economic transformation represents another significant promise of AI. Automation of routine and repetitive tasks could liberate human workers from drudgery, allowing them to focus on more creative, fulfilling, and uniquely human activities. AI-driven productivity gains could generate unprecedented wealth and prosperity, potentially enabling societies to address longstanding issues of resource scarcity and unequal distribution. From more efficient supply chains to personalized education and enhanced scientific research, AI has the potential to accelerate human progress across virtually every domain of endeavor.

However, the same technologies that offer such tremendous promise also present profound challenges and potential perils. Primary among these concerns is the impact of AI on employment. While optimists highlight the historical pattern of technological advancement creating more jobs than it eliminates, the pace and scope of AI-driven automation may prove fundamentally different from previous technological revolutions. Large segments of the workforce, across both blue-collar and white-collar sectors, could face displacement as machines become capable of performing an increasingly wide range of tasks. Without thoughtful policy interventions and educational reforms, this transition could exacerbate economic inequality and social divisions.

Equally concerning are the implications of AI for privacy, autonomy, and human dignity. As AI systems become more sophisticated in analyzing human behavior, predicting preferences, and influencing decisions, the boundaries between helpful personalization and manipulative control grow increasingly blurred. Surveillance technologies powered by AI already enable unprecedented monitoring of individuals, while recommendation algorithms shape our information environment in ways that may undermine genuine autonomy. The collection and exploitation of personal data raise fundamental questions about who should own, control, and benefit from the digital traces of human activity.

The concentration of AI power represents another significant peril. Currently, the development of advanced AI systems requires substantial computational resources, technical expertise, and financial investment. This reality has led to a concentration of AI capabilities among a small number of large technology companies and powerful nation-states. Such concentration raises concerns about monopolistic control over critical infrastructure, the potential for exploitation of vulnerable populations, and the embedding of particular values and biases into systems that may come to mediate significant aspects of human experience. Democratic governance and equitable distribution of AI's benefits require addressing these structural imbalances.

Perhaps most profound are the existential questions raised by the potential development of artificial general intelligence (AGI) – AI systems with intellectual capabilities matching or exceeding those of humans across all domains. While true AGI remains theoretical, its eventual creation would represent a watershed moment in human history, introducing an entity potentially capable of recursive self-improvement and increasingly independent goal-setting. Ensuring that such powerful systems remain aligned with human values and beneficial to human flourishing represents one of the most complex challenges in AI safety research. The stakes could not be higher, as misaligned AGI could pose significant risks to human civilization.

Navigating this complex landscape of promises and perils requires thoughtful governance frameworks that can harness AI's benefits while mitigating its risks. Effective governance must be global in scope yet sensitive to diverse cultural contexts, adaptive to rapidly evolving technologies yet grounded in enduring ethical principles. It must balance innovation and precaution, corporate interests and public goods, national security and international cooperation.

Several governance approaches have emerged in recent years. The European Union's regulatory framework emphasizes human oversight, transparency, and protection of fundamental rights. The United States has favored a more market-oriented approach, though with increasing attention to critical areas like national security and bias mitigation. China has developed a distinctive model combining ambitious national AI initiatives with strong state control. International organizations like the OECD and UNESCO have proposed ethical guidelines and principles for responsible AI development.

Beyond formal governance structures, responsible AI development demands engagement from multiple stakeholders. Technical researchers must prioritize safety, robustness, and alignment in their work, developing methods to make AI systems more explainable, less susceptible to adversarial attacks, and more reliable in complex environments. Companies deploying AI systems must consider not just technical performance and profit potential but broader social impacts and ethical implications. Civil society organizations play crucial roles in advocating for public interests, highlighting potential harms to vulnerable groups, and ensuring diverse perspectives inform AI governance.

Education systems must also evolve to prepare individuals for an AI-influenced world. This preparation involves not just technical training in computer science and data analytics but cultivation of distinctively human capabilities that complement rather than compete with machine intelligence – creativity, emotional intelligence, ethical reasoning, and contextual understanding. Lifelong learning opportunities must be expanded to help workers adapt to changing labor markets, while social safety nets may need strengthening to support those most affected by technological transitions.

The philosophical dimensions of AI development warrant particular attention. As machines display increasingly sophisticated capabilities in domains once considered uniquely human, we may need to reconsider fundamental concepts like intelligence, consciousness, and moral status. The development of AI also raises profound questions about human identity and purpose in a world where many traditional human roles can be performed by machines. Finding meaning and dignity in such a world represents a challenge not just for governance frameworks but for cultural, religious, and philosophical traditions.

Indigenous and non-Western perspectives offer valuable insights often overlooked in dominant AI discourses. Many indigenous knowledge systems emphasize relational ethics, interconnectedness, and long-term thinking that could enrich approaches to AI governance. Similarly, philosophical traditions from various cultures provide diverse conceptual frameworks for understanding human-technology relationships, balancing individual and collective interests, and considering the proper role of technology in human flourishing.

The environmental impact of AI development must also be addressed. Training large AI models requires substantial computational resources and energy consumption, contributing to carbon emissions and environmental degradation. Sustainable AI requires not just more efficient algorithms and hardware but thoughtful consideration of whether the benefits of ever-larger models justify their environmental costs. AI systems can contribute to environmental sustainability through optimizing resource use and enabling more precise environmental monitoring, but their own ecological footprint must be minimized.

Looking toward the future, several scenarios remain possible. In the most optimistic vision, AI becomes a powerful tool for human flourishing, helping solve our greatest challenges while remaining firmly under human control and aligned with human values. In more pessimistic scenarios, AI exacerbates existing inequalities, enables unprecedented surveillance and control, or even poses existential risks through misalignment or malicious use. The actual future will likely contain elements of both promise and peril, with outcomes dependent on our collective choices about how to develop and govern these powerful technologies.

As we navigate this critical juncture in technological and human history, we must approach AI with both cautious optimism and clear-eyed realism. The decisions we make in the coming decades will shape not just the trajectory of technological development but the very future of human civilization. By engaging thoughtfully with both the promises and perils of AI, drawing on diverse perspectives and wisdom traditions, and prioritizing human well-being and flourishing, we can work toward an AI future that amplifies the best of human potential while minimizing harms and risks.

The journey ahead requires unprecedented collaboration across disciplines, sectors, and cultural boundaries. It demands technical innovation matched with ethical reflection, scientific advancement guided by humanistic values, and global cooperation grounded in respect for human dignity and diverse ways of being. The future of AI is not predetermined by technological inevitability but will be shaped by our choices, values, and vision of what technology should serve. In facing this profound responsibility and opportunity, we have the chance to create AI systems that truly complement and enhance what makes us human, rather than diminishing or threatening it. This is the challenge and promise of our age – to harness artificial intelligence in service of authentic human flourishing.`,
  publishedDate: "2024-02-25",
  scrappedDate: new Date().toISOString(),
  wordCount: 1500, // Actual count is about 1500 words, which is a good size for testing
};

async function addTestEssay() {
  try {
    console.log("Connecting to database...");

    // Check if essay already exists
    const existingEssay = await Essay.findOne({ title: testEssay.title });
    if (existingEssay) {
      console.log(
        `Test essay already exists in database with ID: ${existingEssay._id}`
      );
      console.log("You can use this ID with the generate-rc.js script");
      return;
    }

    // Add essay to database
    const newEssay = await Essay.create(testEssay);
    console.log(`Added test essay to database with ID: ${newEssay._id}`);
    console.log("You can use this ID with the generate-rc.js script: ");
    console.log(`node src/scripts/generate-rc.js ${newEssay._id}`);
  } catch (error) {
    console.error("Error adding test essay:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

addTestEssay();

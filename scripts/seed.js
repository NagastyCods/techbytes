/**
 * Fills MongoDB with demo users, categories, tags, posts, comments, and a subscriber.
 * Run: npm run seed
 *
 * Beginner note: this DELETES existing TechBytes collections first so you always
 * get a known starting dataset. Don't run it against a production database.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const slugify = require('slugify');
const { User, Category, Tag, Post, Comment, Subscriber } = require('../src/models');
const env = require('../src/config/env');

function slug(value) {
  return slugify(value, { lower: true, strict: true });
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const article = (paragraphs) => paragraphs.join('\n\n');

async function seed() {
  if (env.isProd) {
    throw new Error('Refusing to seed while NODE_ENV=production.');
  }

  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Tag.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Subscriber.deleteMany({})
  ]);

  const [admin, editor, priya] = await User.create([
    {
      name: 'Amina Okonkwo',
      slug: 'amina-okonkwo',
      email: 'amina@techbytes.local',
      password: 'ChangeMe123!',
      role: 'admin',
      bio: 'Editor-in-chief. Previously covered chips and clouds at two other outlets that shall remain unnamed.',
      avatar: 'https://i.pravatar.cc/160?img=32'
    },
    {
      name: 'Jonas Hale',
      slug: 'jonas-hale',
      email: 'jonas@techbytes.local',
      password: 'ChangeMe123!',
      role: 'editor',
      bio: 'Gadgets, batteries, and the strange ways we hold computers in our hands.',
      avatar: 'https://i.pravatar.cc/160?img=12'
    },
    {
      name: 'Priya Raman',
      slug: 'priya-raman',
      email: 'priya@techbytes.local',
      password: 'ChangeMe123!',
      role: 'author',
      bio: 'Writes about AI systems the way other people write about weather: often, carefully, and with an umbrella.',
      avatar: 'https://i.pravatar.cc/160?img=47'
    }
  ]);

  const categories = await Category.create([
    { name: 'AI', slug: 'ai', description: 'Models, labs, policy, and the products they become.', accentColor: '#7c3aed' },
    { name: 'Gadgets', slug: 'gadgets', description: 'Phones, laptops, wearables, and the accessories we pretend we need.', accentColor: '#0f766e' },
    { name: 'Software', slug: 'software', description: 'The tools people actually ship, break, and patch on Fridays.', accentColor: '#2563eb' },
    { name: 'Startups', slug: 'startups', description: 'Funding, focus, and the occasional reality check.', accentColor: '#b45309' },
    { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Incidents, defenses, and why “just update” is never just that.', accentColor: '#be123c' }
  ]);

  const cat = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const tags = await Tag.create(
    ['llms', 'chips', 'open-source', 'privacy', 'funding', 'android', 'apple', 'cloud', 'ransomware', 'devtools'].map((name) => ({
      name,
      slug: slug(name)
    }))
  );
  const tag = Object.fromEntries(tags.map((t) => [t.slug, t]));

  const postsInput = [
    {
      title: 'The quiet year of “good enough” AI',
      excerpt: 'Frontier labs still race. Most of us just need a model that does not hallucinate the meeting notes.',
      coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=80',
      author: priya._id,
      category: cat.ai._id,
      tags: [tag.llms._id, tag.privacy._id],
      featured: true,
      views: 1840,
      publishedAt: daysAgo(1),
      seo: {
        metaTitle: 'The quiet year of good enough AI',
        metaDescription: 'Why useful beats flashy as language models settle into everyday software.'
      },
      content: article([
        'For two years the industry sold astonishment. This year it is selling *reliability*, which is less photogenic and more useful.',
        '## What changed in the stack',
        'Teams stopped treating a single giant model as a product. They wrap a cheaper model in retrieval, tools, and a human who can still say no.',
        '### Retrieval is the new homepage',
        'If the answer is in your docs, you should not be gambling on parametric memory. The boring architecture — embed, fetch, cite — is winning procurement meetings.',
        '## The policy weather',
        'Regulators are slower than launch blogs, but they are no longer theoretical. Watermarks, provenance, and training-data receipts are becoming table stakes in Europe and, increasingly, in enterprise contracts everywhere else.',
        '## What to watch next',
        'Not another chatbot. On-device models that are allowed to see your calendar without shipping it to a GPU farm in another time zone.'
      ])
    },
    {
      title: 'A folding phone that finally feels like a phone',
      excerpt: 'The hinge is quieter. The crease is fainter. The software still thinks you own two screens, not one object.',
      coverImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80',
      author: editor._id,
      category: cat.gadgets._id,
      tags: [tag.android._id, tag.apple._id],
      views: 990,
      publishedAt: daysAgo(2),
      content: article([
        'Foldables used to be a dare. This generation is an argument: maybe you *do* want a tablet in your pocket if it does not fight you.',
        '## Hardware that got out of the way',
        'The inner display is brighter in noon sun. The cover screen is wide enough to type a real sentence. Battery life is merely fine, which is a compliment.',
        '## Software is the remaining crease',
        'Apps still snap between awkward ratios. The best ones treat the inner display as a canvas; the rest letterbox themselves and hope you do not notice.',
        '## Should you buy one?',
        'If you already live in split-screen documents, yes. If you want a camera that wins a desert island test, buy a slab and a better weekend.'
      ])
    },
    {
      title: 'Why your CI bill looks like a second rent payment',
      excerpt: 'Minutes are cheap until every pull request rebuilds the universe. Here is how teams cut the meter without cutting quality.',
      coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80',
      author: admin._id,
      category: cat.software._id,
      tags: [tag.devtools._id, tag['open-source']._id, tag.cloud._id],
      views: 1260,
      publishedAt: daysAgo(3),
      content: article([
        'Continuous integration is a public good until finance forwards you the invoice with a frowny emoji.',
        '## The usual suspects',
        'Monorepos that test everything. Docker images rebuilt from `apt-get update`. Flaky suites that retry themselves into a small fortune.',
        '## Fixes that actually stick',
        'Cache aggressively. Shard tests by historical timing, not by folder folklore. And stop running the mobile suite on a docs typo.',
        '### A cultural patch',
        'Make CI minutes visible on the pull request. Engineers optimize what they can see.'
      ])
    },
    {
      title: 'Seed decks are getting shorter. The questions are not.',
      excerpt: 'Investors still want a story. They just refuse to sit through slide 19 about “TAM in 2032.”',
      coverImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1600&q=80',
      author: admin._id,
      category: cat.startups._id,
      tags: [tag.funding._id],
      views: 640,
      publishedAt: daysAgo(4),
      content: article([
        'A 12-slide deck is not a personality. It is a filter: can you say the true thing quickly?',
        '## What still matters',
        'A sharp customer, a wedge, and evidence that someone already paid. Everything else is atmosphere.',
        '## What got cut',
        'Competitive matrices with 14 logos. Team slides that read like LinkedIn. TAM math that assumes every human owns three subscriptions.',
        '## The awkward part',
        'Shorter decks mean faster no’s. That is a feature. Time is the only runway you cannot extend with a clever footnote.'
      ])
    },
    {
      title: 'Ransomware crews are running help desks now',
      excerpt: 'The leak sites are uglier. The phone support is strangely polite. The backups are still the actual story.',
      coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
      author: priya._id,
      category: cat.cybersecurity._id,
      tags: [tag.ransomware._id, tag.privacy._id],
      views: 1510,
      publishedAt: daysAgo(5),
      content: article([
        'Attackers productized empathy. Negotiation portals have FAQs. Some crews offer “customer success” if you pay before the press cycle.',
        '## How the playbook evolved',
        'Double extortion is standard. Triple — leak, encrypt, and harass customers — is the upsell.',
        '## Defense that is not a slogan',
        'Immutable backups, identity hygiene, and a tabletop that includes legal *before* the incident Slack channel exists.',
        '## If you are already in it',
        'Assume the help desk on the other side is better rehearsed than yours. Write the decision tree on a calm Tuesday.'
      ])
    },
    {
      title: 'Open source maintainers are charging for the boring parts',
      excerpt: 'The license stays free. The CI minutes, security advisories, and 2 a.m. patches do not.',
      coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80',
      author: editor._id,
      category: cat.software._id,
      tags: [tag['open-source']._id, tag.devtools._id],
      views: 870,
      publishedAt: daysAgo(6),
      content: article([
        'Nobody is owed infinite unpaid labor because `npm install` was convenient in 2016.',
        '## Dual tracks, one codebase',
        'The library remains MIT. Support, SLAs, and hosted extras sit behind a contract. That split is getting less apologetic.',
        '## What companies should do',
        'Budget for the software you silently depend on. If a maintainer vanishes, you will pay anyway — just in incident time.',
        '## What maintainers should not do',
        'Ambush relicensing on a Friday. People remember how you asked, not only that you asked.'
      ])
    },
    {
      title: 'On-device chips are eating the demo reel',
      excerpt: 'NPUs in laptops finally have software that notices they exist. The cloud is still there — just not for every keystroke.',
      coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
      author: priya._id,
      category: cat.ai._id,
      tags: [tag.chips._id, tag.llms._id],
      views: 1104,
      publishedAt: daysAgo(7),
      content: article([
        'A local 7-billion-parameter model will not write your novel. It will summarize the PDF you should not have uploaded anyway.',
        '## Latency is a feature',
        'Offline autocomplete feels like magic after a year of spinners. Privacy is the bonus track.',
        '## The catch',
        'Thermals. Laptops that translate a meeting also become hand warmers. Vendors are still negotiating with physics.',
        '## A practical split',
        'Small models at the edge, big models for the once-a-day hard question. That hybrid is the grown-up architecture.'
      ])
    },
    {
      title: 'A startup that sells “less software” just raised a round',
      excerpt: 'The pitch: delete half your tools. The product: a ruthless inventory of what nobody opened last quarter.',
      coverImage: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1600&q=80',
      author: editor._id,
      category: cat.startups._id,
      tags: [tag.funding._id, tag.cloud._id],
      views: 420,
      publishedAt: daysAgo(8),
      content: article([
        'SaaS sprawl became a line item with a name. Founders noticed.',
        '## The product is a mirror',
        'It maps logins, invoices, and last-active dates. Then it suggests cancellations you will argue with, then accept.',
        '## Why investors leaned in',
        'CFOs already believe the problem. Selling a dashboard into an existing grudge is easier than selling a new habit.',
        '## The risk',
        'If it works too well, customers need it less. The company will have to sell taste, not just a spreadsheet with opinions.'
      ])
    }
  ];

  const posts = await Post.create(
    postsInput.map((p) => ({
      ...p,
      slug: slug(p.title),
      status: 'published'
    }))
  );

  await Comment.create([
    {
      post: posts[0]._id,
      name: 'Chris Vale',
      email: 'chris@example.com',
      body: 'The “good enough” framing is right. We replaced a flashy vendor with a smaller model plus search and nobody missed the fireworks.',
      status: 'approved'
    },
    {
      post: posts[0]._id,
      name: 'Lina Ortiz',
      email: 'lina@example.com',
      body: 'Would love a follow-up on on-device evals. Lab benches and commuter trains are different planets.',
      status: 'approved'
    },
    {
      post: posts[4]._id,
      name: 'Samir',
      email: 'samir@example.com',
      body: 'Please keep stressing immutable backups. Everything else is commentary.',
      status: 'pending'
    }
  ]);

  await Subscriber.create({ email: 'reader@techbytes.local' });

  console.log('Seed complete.');
  console.log('Users: amina@ / jonas@ / priya@ techbytes.local  password: ChangeMe123!');
  console.log(`Posts: ${posts.length}`);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});

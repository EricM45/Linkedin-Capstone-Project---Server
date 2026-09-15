import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import User from './models/User.js'
import Post from './models/Post.js'
import Connection from './models/Connection.js'
import Job from './models/Job.js'
import Message from './models/Message.js'
import Notification from './models/Notification.js'

dotenv.config()

const photo = (g, n) =>
  `https://randomuser.me/api/portraits/${g === 'm' ? 'men' : 'women'}/${n}.jpg`
const banner = (s) => `https://picsum.photos/seed/${s}/1200/300`

const people = [
  {
    name: 'Eric Money', email: 'eric@gmail.com', password: '123', g: 'm', n: 3,
    headline: 'Full-Stack Developer | MERN | Building a LinkedIn clone',
    location: 'Norfolk, Virginia',
    about: 'Full-stack bootcamp graduate focused on the MERN stack. Currently building a professional-network capstone. Open to junior software engineer roles.',
    skills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Redux', 'REST APIs', 'Git'],
    experience: [
      { title: 'Software Engineer Intern', company: 'Tidewater Tech', location: 'Remote', startDate: 'Jun 2026', endDate: '', current: true, description: 'Building internal tools with React and Express.' },
      { title: 'IT Support Specialist', company: 'Coastal Systems', location: 'Norfolk, VA', startDate: 'Jan 2024', endDate: 'May 2026', current: false, description: 'Supported 200+ end users; automated onboarding with scripts.' },
    ],
    education: [{ school: 'Full Stack Development Bootcamp', degree: 'Certificate', field: 'Software Engineering', startYear: '2025', endYear: '2026' }],
  },
  { name: 'Ava Robinson', email: 'ava@example.com', g: 'f', n: 9, headline: 'Senior Frontend Engineer at Northstar', location: 'Seattle, WA',
    about: 'Accessibility-first frontend engineer. React, TypeScript, design systems.',
    skills: ['React', 'TypeScript', 'Accessibility', 'CSS', 'Design Systems'],
    experience: [{ title: 'Senior Frontend Engineer', company: 'Northstar', current: true, startDate: 'Mar 2023', description: 'Own the component library used by 6 product teams.' }],
    education: [{ school: 'University of Washington', degree: 'B.S.', field: 'Computer Science', startYear: '2014', endYear: '2018' }] },
  { name: 'James Carter', email: 'james@example.com', g: 'm', n: 12, headline: 'Backend Engineer | Node.js & Distributed Systems', location: 'Denver, CO',
    about: 'I make APIs fast and boring. Node, Postgres, Redis, Kafka.',
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'System Design', 'Docker'],
    experience: [{ title: 'Backend Engineer', company: 'Cirrus Data', current: true, startDate: 'Jan 2022' }],
    education: [{ school: 'Colorado State University', degree: 'B.S.', field: 'Software Engineering', startYear: '2013', endYear: '2017' }] },
  { name: 'Maya Patel', email: 'maya@example.com', g: 'f', n: 44, headline: 'Product Manager at Gridline | ex-Data Analyst', location: 'Chicago, IL',
    about: 'Turning messy dashboards into decisions. Data-informed, user-obsessed.',
    skills: ['Product Management', 'SQL', 'Analytics', 'Roadmapping', 'User Research'],
    experience: [{ title: 'Product Manager', company: 'Gridline', current: true, startDate: 'Sep 2023' }],
    education: [{ school: 'Northwestern University', degree: 'B.A.', field: 'Economics', startYear: '2012', endYear: '2016' }] },
  { name: 'Marcus Bell', email: 'marcus@example.com', g: 'm', n: 83, headline: 'Full-Stack Engineer | MERN | Mentor', location: 'Atlanta, GA',
    about: 'Shipping full-stack features and mentoring bootcamp grads.',
    skills: ['MongoDB', 'Express', 'React', 'Node.js', 'Mentoring'],
    experience: [{ title: 'Full-Stack Engineer', company: 'Peachtree Labs', current: true, startDate: 'May 2021' }],
    education: [{ school: 'Georgia State University', degree: 'B.S.', field: 'Computer Science', startYear: '2012', endYear: '2016' }] },
  { name: 'Sofia Martinez', email: 'sofia@example.com', g: 'f', n: 21, headline: 'DevOps Engineer | AWS | Kubernetes', location: 'San Diego, CA',
    about: 'Reliability, pipelines, and sleeping through the night.',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Observability'],
    experience: [{ title: 'DevOps Engineer', company: 'Harbor Cloud', current: true, startDate: 'Feb 2022' }],
    education: [{ school: 'UC San Diego', degree: 'B.S.', field: 'Computer Engineering', startYear: '2013', endYear: '2017' }] },
  { name: 'Ethan Brooks', email: 'ethan@example.com', g: 'm', n: 67, headline: 'Design Engineer | Design Systems & Front-of-Front-End', location: 'Portland, OR',
    about: 'The bridge between Figma and production. Tokens, a11y, motion.',
    skills: ['Design Systems', 'Figma', 'CSS', 'React', 'Accessibility'],
    experience: [{ title: 'Design Engineer', company: 'Rainier UX', current: true, startDate: 'Aug 2021' }],
    education: [{ school: 'Portland State University', degree: 'B.F.A.', field: 'Graphic Design', startYear: '2011', endYear: '2015' }] },
  { name: 'Chloe Bennett', email: 'chloe@example.com', g: 'f', n: 58, headline: 'Frontend Engineer | React & Redux | Technical Writer', location: 'Boston, MA',
    about: 'I write the Redux so you don’t have to — and then I document it.',
    skills: ['React', 'Redux', 'Testing', 'Technical Writing', 'TypeScript'],
    experience: [{ title: 'Frontend Engineer', company: 'Beacon Software', current: true, startDate: 'Jun 2022' }],
    education: [{ school: 'Boston University', degree: 'B.A.', field: 'English & CS', startYear: '2014', endYear: '2018' }] },
  { name: 'Noah Silva', email: 'noah@example.com', g: 'm', n: 45, headline: 'Software Engineer | Mobile & Web | React Native', location: 'Miami, FL',
    about: 'Cross-platform apps and clean commit messages.',
    skills: ['React Native', 'React', 'TypeScript', 'GraphQL'],
    experience: [{ title: 'Software Engineer', company: 'Sunline Apps', current: true, startDate: 'Mar 2021' }],
    education: [{ school: 'University of Miami', degree: 'B.S.', field: 'Computer Science', startYear: '2012', endYear: '2016' }] },
  { name: 'Isla Thompson', email: 'isla@example.com', g: 'f', n: 72, headline: 'Engineering Manager at Union | Community Builder', location: 'Brooklyn, NY',
    about: 'Growing engineers and healthy teams. Hiring junior devs — reach out.',
    skills: ['Engineering Management', 'Hiring', 'Coaching', 'Agile'],
    experience: [{ title: 'Engineering Manager', company: 'Union', current: true, startDate: 'Jan 2020' }],
    education: [{ school: 'NYU', degree: 'B.S.', field: 'Information Systems', startYear: '2008', endYear: '2012' }] },
  { name: 'Liam Nguyen', email: 'liam@example.com', g: 'm', n: 32, headline: 'Junior Developer | React | Bootcamp Grad', location: 'Austin, TX',
    about: 'Learning in public, shipping small things often.',
    skills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git'],
    experience: [{ title: 'Junior Developer', company: 'Lone Star Digital', current: true, startDate: 'Jul 2026' }],
    education: [{ school: 'Full Stack Development Bootcamp', degree: 'Certificate', field: 'Software Engineering', startYear: '2025', endYear: '2026' }] },
  { name: 'Priya Sharma', email: 'priya@example.com', g: 'f', n: 16, headline: 'Data Engineer | Python, Spark, dbt', location: 'Raleigh, NC',
    about: 'Pipelines that don’t page me at 3am.',
    skills: ['Python', 'Spark', 'dbt', 'SQL', 'Airflow'],
    experience: [{ title: 'Data Engineer', company: 'Research Triangle Data', current: true, startDate: 'Sep 2022' }],
    education: [{ school: 'NC State University', degree: 'B.S.', field: 'Statistics', startYear: '2013', endYear: '2017' }] },
]

const POSTS = {
  avarobinson: ['Shipped a full keyboard-navigation pass on our date picker today. Tiny component, huge relief.', 'Reminder: a focus ring is a feature, not a bug. Please stop removing them.'],
  jamescarter: ['"We need a queue" is, 80% of the time, "we need an index." Ask me how I know.'],
  mayapatel: ['Killed 3 dashboards nobody opened this quarter. Best roadmap decision I made.', 'A dashboard nobody opens is a very slow, very expensive email.'],
  marcusbell: ['Mentoring two bootcamp grads this cohort. Watching the "it clicked" moment never gets old.'],
  sofiamartinez: ['Cut our deploy time from 14 min to 4. The secret was deleting things, as usual.'],
  ethanbrooks: ['Converted the last hard-coded spacing value to a token today. The diff was enormous. Worth it.'],
  chloebennett: ['createAsyncThunk is just pending / fulfilled / rejected and a good night’s sleep.'],
  islathompson: ['We’re hiring 2 junior engineers. If you finished a bootcamp this year and have a project you’re proud of, my DMs are open.'],
  ericmoney: ['Two weeks into my capstone: a LinkedIn-style network built on the MERN stack. Auth, profiles, a connection graph, and a feed are all working. Onward.'],
  liamnguyen: ['First week at my first dev job. Imposter syndrome is loud but the tests are green.'],
}

const key = (name) => name.toLowerCase().replace(/[^a-z]/g, '')

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI missing')
  await mongoose.connect(uri)
  console.log('connected:', mongoose.connection.name)

  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Connection.deleteMany({}),
    Job.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
  ])

  const docs = []
  for (const p of people) {
    docs.push({
      name: p.name,
      email: p.email,
      password: await bcrypt.hash(p.password || 'password123', 10),
      headline: p.headline,
      about: p.about,
      location: p.location,
      profilePhoto: photo(p.g, p.n),
      bannerPhoto: banner(key(p.name)),
      skills: p.skills || [],
      experience: p.experience || [],
      education: p.education || [],
    })
  }
  const users = await User.insertMany(docs)
  const byKey = Object.fromEntries(users.map((u) => [key(u.name), u]))
  const eric = byKey.ericmoney

  /* $$ Eric connected to 6, plus 3 pending invitations for Eric to accept $$ */
  const others = users.filter((u) => !u._id.equals(eric._id))
  const connected = others.slice(0, 6)
  const inviters = others.slice(6, 9)

  const conns = []
  for (const u of connected) conns.push({ requester: eric._id, recipient: u._id, status: 'accepted' })
  for (const u of inviters) conns.push({ requester: u._id, recipient: eric._id, status: 'pending' })
  /* $$ a web of connections among the others so their feeds aren't empty $$ */
  for (let i = 0; i < others.length; i++) {
    for (let j = i + 1; j < others.length; j++) {
      if ((i + j) % 3 === 0) conns.push({ requester: others[i]._id, recipient: others[j]._id, status: 'accepted' })
    }
  }
  await Connection.insertMany(conns)

  const postDocs = []
  let hoursAgo = 90
  for (const [k, texts] of Object.entries(POSTS)) {
    const author = byKey[k]
    if (!author) continue
    for (const text of texts) {
      hoursAgo -= 3 + Math.random() * 5
      const likers = users.filter(() => Math.random() < 0.4).map((u) => u._id)
      postDocs.push({
        author: author._id,
        text,
        image: '',
        likes: likers,
        createdAt: new Date(Date.now() - hoursAgo * 3600 * 1000),
        updatedAt: new Date(Date.now() - hoursAgo * 3600 * 1000),
      })
    }
  }
  const posts = await Post.insertMany(postDocs, { timestamps: false })

  /* $$ a couple of comments on Eric's + Isla's posts $$ */
  const ericPost = posts.find((p) => p.author.equals(eric._id))
  if (ericPost) {
    ericPost.comments.push({ author: byKey.marcusbell._id, text: 'This is a great capstone choice. Ping me if you want a code review.' })
    ericPost.comments.push({ author: byKey.islathompson._id, text: 'Add it to your profile when it’s live — exactly the kind of project we look for.' })
    await ericPost.save()
  }

  /* $$ jobs: a few of Eric's connections post openings; Eric posts one too $$ */
  const jobPosters = connected.slice(0, 3)
  const jobDocs = [
    { postedBy: jobPosters[0]._id, title: 'Junior Frontend Engineer', company: jobPosters[0].headline?.split(' at ')[1] || 'Northstar', location: jobPosters[0].location, type: 'Full-time', description: 'React + TypeScript, great for a recent bootcamp grad. Mentorship built in.' },
    { postedBy: jobPosters[1]._id, title: 'Backend Engineer (Node.js)', company: jobPosters[1].location, location: jobPosters[1].location, type: 'Full-time', description: 'Own API services end to end. Node, Postgres, Docker.' },
    { postedBy: jobPosters[2]._id, title: 'DevOps Intern', company: 'Harbor Cloud', location: jobPosters[2].location, type: 'Internship', description: 'Help us ship CI/CD improvements over a summer internship.' },
    { postedBy: eric._id, title: 'Capstone Study Partner', company: 'Self-taught', location: 'Remote', type: 'Contract', description: 'Not a real job — pairing on MERN capstone projects, async.' },
  ]
  const jobs = await Job.insertMany(jobDocs)

  /* $$ several message threads across the network, so the inbox looks like a real, lived-in account $$ */
  const buddy = connected[0]
  const now = Date.now()
  const h = (n) => new Date(now - n * 3600_000)
  await Message.insertMany([
    { sender: buddy._id, recipient: eric._id, text: `Hey ${eric.name.split(' ')[0]}, saw your capstone post — looks great!`, read: true, createdAt: h(5) },
    { sender: eric._id, recipient: buddy._id, text: 'Thanks! Just added real-time notifications and messaging today.', read: true, createdAt: h(4) },
    { sender: buddy._id, recipient: eric._id, text: 'Nice, that’s the hard part. Ping me if you want a second pair of eyes.', read: false, createdAt: h(2) },

    { sender: byKey.jamescarter._id, recipient: eric._id, text: 'Saw your post about the connection graph — nice. How are you handling the pending/accepted states?', read: true, createdAt: h(70) },
    { sender: eric._id, recipient: byKey.jamescarter._id, text: 'One Connection doc per pair with a status field, plus a compound index on requester/recipient so I can query both directions.', read: true, createdAt: h(69) },
    { sender: byKey.jamescarter._id, recipient: eric._id, text: 'Clean. I overcomplicated mine with two separate collections the first time around.', read: true, createdAt: h(68) },
    { sender: eric._id, recipient: byKey.jamescarter._id, text: 'Ha, yeah I almost went that route too. Glad I didn’t.', read: true, createdAt: h(67.5) },
    { sender: byKey.jamescarter._id, recipient: eric._id, text: 'If you ever want a second pair of eyes on the API design, happy to take a look.', read: false, createdAt: h(20) },

    { sender: byKey.mayapatel._id, recipient: eric._id, text: 'Your capstone demo looked solid. What’s the plan for the job board — is applying meant to be a real ATS flow eventually?', read: true, createdAt: h(50) },
    { sender: eric._id, recipient: byKey.mayapatel._id, text: 'For now it just records interest and notifies me — keeping scope tight for the capstone deadline. A real ATS flow would be a nice v2.', read: true, createdAt: h(49) },
    { sender: byKey.mayapatel._id, recipient: eric._id, text: 'Smart call. Scope creep kills more capstones than bugs do.', read: false, createdAt: h(15) },

    { sender: byKey.marcusbell._id, recipient: eric._id, text: 'Left you a comment on your post, but wanted to say it directly too — proud of how far this has come.', read: true, createdAt: h(90) },
    { sender: eric._id, recipient: byKey.marcusbell._id, text: 'That means a lot, thank you. Wouldn’t have pushed through the real-time stuff without your code review offer.', read: true, createdAt: h(89) },
    { sender: byKey.marcusbell._id, recipient: eric._id, text: 'Anytime. Let me know when you’re ready to talk about what’s next after this.', read: false, createdAt: h(6) },

    // a thread between two other users, not involving Eric — so the network feels alive beyond just his own inbox
    { sender: byKey.sofiamartinez._id, recipient: byKey.ethanbrooks._id, text: 'Your design tokens post made me want to redo our Grafana dashboards from scratch.', read: true, createdAt: h(40) },
    { sender: byKey.ethanbrooks._id, recipient: byKey.sofiamartinez._id, text: 'Please don’t — I still have nightmares about the last dashboard redesign.', read: true, createdAt: h(39) },
    { sender: byKey.sofiamartinez._id, recipient: byKey.ethanbrooks._id, text: 'Fair. One panel at a time then.', read: false, createdAt: h(38) },
  ], { timestamps: false })

  /* $$ a handful of varied notifications waiting for Eric $$ */
  await Notification.insertMany([
    { recipient: eric._id, actor: buddy._id, type: 'post_like', post: ericPost?._id, read: false, createdAt: h(7) },
    { recipient: eric._id, actor: jobPosters[0]._id, type: 'job_post', job: jobs[0]._id, read: false, createdAt: h(5) },
    { recipient: eric._id, actor: byKey.marcusbell._id, type: 'connection_accepted', read: true, createdAt: h(91) },
    { recipient: eric._id, actor: byKey.jamescarter._id, type: 'post_comment', post: ericPost?._id, read: false, createdAt: h(18) },
    { recipient: eric._id, actor: byKey.islathompson._id, type: 'post_like', post: ericPost?._id, read: false, createdAt: h(12) },
  ], { timestamps: false })

  console.log(`seeded ${users.length} users, ${posts.length} posts, ${conns.length} connections, ${jobs.length} jobs`)
  console.log('login:  eric@gmail.com / 123   (others: <first>@example.com / password123)')
  await mongoose.disconnect()
}

run().catch((e) => {
  console.error('seed failed:', e.message)
  process.exit(1)
})

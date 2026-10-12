const express = require('express');
const router = express.Router();

// 13. GET /api/presets
router.get('/', (req, res) => {
  const presets = [
    {
      id: 'junior-frontend',
      title: 'Junior Frontend Developer',
      level: 'Junior',
      companyType: 'Startup / Agency',
      description: `We are looking for an enthusiastic Junior Frontend Developer to build clean, responsive, and accessible user interfaces.
Key Responsibilities:
- Build interactive web applications using HTML5, CSS3, modern JavaScript (ES6+), and React.js.
- Develop reusable React components utilizing modern hooks (useState, useEffect, useRef) and props.
- Integrate frontend interfaces with backend RESTful APIs using fetch/axios, handling loading and error states gracefully.
- Create responsive layouts that look great on mobile and desktop using Flexbox, CSS Grid, and media queries.
- Debug UI issues using browser DevTools and collaborate with designers to turn Figma wireframes into pixel-perfect code.`
    },
    {
      id: 'junior-fullstack',
      title: 'Junior Full Stack Developer',
      level: 'Junior',
      companyType: 'Full Stack Product Team',
      description: `We are seeking an eager Junior Full Stack Developer to build end-to-end web features across React and Node.js.
Key Responsibilities:
- Develop interactive frontend views using React.js, modern JavaScript, and clean custom CSS.
- Build and maintain RESTful API endpoints using Node.js, Express.js, and JSON data formats.
- Connect backend routes to relational databases (SQLite / PostgreSQL) and write standard CRUD SQL queries.
- Implement secure authentication practices such as password hashing (bcrypt) and JSON Web Tokens (JWT).
- Test endpoints, write clean and maintainable code, and debug full-stack data flow from database to UI.`
    },
    {
      id: 'frontend-react',
      title: 'Frontend React Engineer',
      level: 'Mid-to-Senior',
      companyType: 'Enterprise SaaS',
      description: `Seeking an experienced Frontend React Developer passionate about UI craft, performance, and user delight.
Key Responsibilities:
- Build modular React applications utilizing modern hooks, context, virtualized lists, and clean CSS.
- Profile and improve Client-Side rendering performance, reducing TTFB and First Contentful Paint.
- Collaborate closely with Product Designers to implement pixel-perfect, accessible design systems.
- Manage asynchronous state, optimistic updates, and offline resilience.`
    },
    {
      id: 'fullstack-senior',
      title: 'Senior Full Stack Engineer',
      level: 'Senior',
      companyType: 'High-growth FinTech',
      description: `We are looking for a Senior Full Stack Engineer to lead architecture across our React frontend and Node.js microservices.
Key Responsibilities:
- Design and scale distributed RESTful APIs using Node.js, Express, and PostgreSQL/SQLite with Redis caching.
- Build responsive, accessible, high-performance UI components with React, TypeScript, and modern state architecture.
- Optimize web vitals, profile bundle sizes, and eliminate API bottlenecks under high transaction loads.
- Mentor engineers, drive design reviews, and establish CI/CD best practices.`
    },
    {
      id: 'backend-node',
      title: 'Backend Systems Engineer',
      level: 'Mid-Level',
      companyType: 'Cloud Infrastructure',
      description: `Join our core platform engineering team building mission-critical backend services and APIs.
Key Responsibilities:
- Develop robust, secure RESTful APIs with Node.js, Express, and relational databases.
- Design database schemas, write optimized SQL queries, and implement transaction management.
- Implement token-based authentication (JWT, OAuth2), rate limiting, and RBAC security models.
- Maintain comprehensive unit and integration testing pipelines.`
    },
    {
      id: 'ai-engineer',
      title: 'AI / LLM Application Engineer',
      level: 'Senior',
      companyType: 'AI Startup',
      description: `Build next-generation generative AI products integrating LLMs, multi-agent systems, and voice APIs.
Key Responsibilities:
- Integrate Gemini, Claude, and OpenAI APIs into customer-facing full-stack applications.
- Design structured prompt engineering workflows, evaluation benchmarks, and RAG pipelines.
- Build low-latency streaming interfaces, speech-to-text audio pipelines, and real-time feedback loops.
- Monitor token costs, latency spikes, and LLM output consistency in production.`
    }
  ];

  return res.json({ presets });
});

module.exports = router;

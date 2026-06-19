# Truth

**Truth** is a centralized OAuth 2.0 architecture serving as the secure identity hub for a broader microservices ecosystem _(Kinda a blindshot for now but let's see)_. Built with a robust backend architecture, it acts as a Key Distribution Center (KDC) to handle auth keys dynamically, natively supporting PKCE alongside secure access and refresh token flows to provide a scalable blueprint that seamlessly powers future service additions down the line.

---

## A Note on Authenticity

> This project is 100% human-built code—no AI-generated slop here. Every architecture choice, collection constraint, and route handler was forged out of my own time, severe headaches, and genuine developer tears. _(I kid you not. I questioned my life here.)_

---

## Prerequisites & Startup

Before diving in, make sure you have the following installed on your machine:

- **Docker** (with Docker Compose)
    

Since containerization handles all the heavy lifting, you don't need to worry about setting up local Node or database runtimes manually.

### Getting Started

1. Clone the repository and navigate to the root directory.
    
2. Fire up the ecosystem by running:
    

```bash
docker compose up --build
```

3. Once the containers are healthy, open your browser and visit:
    

`http://localhost:5173`

to access the main frontend portal.

---

## Usage

Alright, let's be real—Truth is currently in its early `dev-1.*.*` days. That means getting it running for external applications requires a fair bit of manual database tweaking behind the scenes (yes, I'm manually poking the database to make it work for now).

I'll deal with writing a comprehensive, step-by-step integration guide later once the system becomes fully autonomous! For now, feel free to pull it down and poke around the core portal structure.

---

## Motivation

Let’s keep it real, I am building this project single-handedly to serve as my golden ticket to landing my first software development job. It is the flagship piece of my personal resume, designed to prove I can tackle complex, enterprise-grade system design.

Beyond the portfolio grind, if I succeed in making this entire architecture perfectly robust and battle-tested, my ultimate goal is to unleash it as a proper, production-ready open-source identity provider that anyone can plug into their own applications.

---

## Contributing

Because the project is firmly in its "dev" phase and still requires a bit of manual babysitting to run, I am not looking for external contributions or pull requests right now. However, as soon as Truth graduates into its autonomous **Alpha** stage, I would love to open the floodgates for collaboration. Follow along until then!
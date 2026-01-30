![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

# Document Q&A System

AI chatbot that answers questions from your documents using RAG.

## 🚀 Demo
**Try it:** [https://document-qa-rag-eta.vercel.app/](https://document-qa-rag-eta.vercel.app/)


## ⚡ Features
- Upload PDF/DOCX/TXT
- AI answers from your documents
- Source citations with confidence score
- Chat history

## 🛠️ Stack
Frontend: Next.js + TypeScript + Tailwind  
Backend: Express + LangChain + OpenAI  
Database: PostgreSQL + pgvector

## 📖 How It Works
1. Upload document → Extract & chunk text
2. Create embeddings → Store in vector DB
3. Ask question → Find similar chunks
4. Generate answer → Cite sources

## 🏃 Quick Start
```bash
# Backend
cd backend && bun install && bun run dev

# Frontend  
cd frontend && bun install && bun dev

or use npm
```

## 🎓 Learning
Built to learn RAG, vector embeddings, and LLM integration.

---
Made with ❤️ | [GitHub](https://github.com/NattX28) | [Live Demo](https://document-qa-rag-eta.vercel.app/)

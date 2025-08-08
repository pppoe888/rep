# Replit Configuration

## Overview

This is a full-stack Telegram bot creation platform built with React, Express, and PostgreSQL. The application allows users to create and manage intelligent Telegram bots powered by OpenAI's GPT models. Users can configure bot personalities, test conversations, and deploy bots with custom Telegram tokens.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon Database)
- **Session Management**: In-memory storage with fallback to PostgreSQL sessions
- **API Design**: RESTful endpoints with centralized error handling

### Database Design
- **Users Table**: Stores user authentication data with username/password
- **Bots Table**: Contains bot configurations including Telegram tokens, GPT settings, and personality
- **Bot Messages Table**: Logs conversation history between users and bots
- **Schema Management**: Drizzle migrations with type-safe schema definitions

### Authentication & Authorization
- **Strategy**: Session-based authentication with demo user for development
- **Security**: Password hashing and secure session management
- **Access Control**: User-specific bot access with ownership validation

### Bot Management System
- **Telegram Integration**: Direct integration with Telegram Bot API for message handling
- **AI Processing**: OpenAI GPT integration with configurable models (GPT-5, GPT-4o, GPT-4, GPT-3.5-turbo), temperature, and token limits
- **Bot Lifecycle**: Create, configure, start/stop, and delete bot operations
- **Message Handling**: Real-time message processing with conversation logging

### Development Environment
- **Hot Reload**: Vite development server with HMR for frontend
- **TypeScript**: Strict type checking across client, server, and shared modules
- **Path Aliases**: Configured aliases for clean imports (@/, @shared/, @assets/)
- **Replit Integration**: Custom plugins for development environment optimization

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL database hosting with connection pooling
- **OpenAI API**: GPT model access for intelligent bot responses
- **Telegram Bot API**: Direct integration for bot creation and message handling

### UI and Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Fast bundling for production builds
- **TSX**: TypeScript execution for development server
- **Replit Plugins**: Development environment enhancements

### Runtime Libraries
- **TanStack Query**: Server state management with caching and synchronization
- **Node Telegram Bot API**: Telegram bot SDK for Node.js
- **Zod**: Runtime type validation for API requests and forms
- **Date-fns**: Date manipulation and formatting utilities
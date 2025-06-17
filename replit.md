# SongCraft AI - Text to Song Generator

## Overview

SongCraft AI is a full-stack web application that allows users to generate songs from text input. Users can provide lyrics, select musical styles, upload voice samples, and generate AI-powered songs with customizable parameters. The application features a modern, music-focused interface inspired by popular streaming platforms.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Bundler**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens for a music-themed aesthetic
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **File Uploads**: Multer middleware for handling audio file uploads
- **Development**: tsx for TypeScript execution in development

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM (active)
- **File Storage**: Local file system for audio uploads (uploads/ directory)
- **Database Connection**: Neon serverless PostgreSQL via DATABASE_URL

## Key Components

### Database Schema
The application uses three main database tables:

1. **Users Table**: Basic user authentication and identification
   - Fields: id, username, password

2. **Voice Samples Table**: User-uploaded audio samples for voice cloning
   - Fields: id, userId, name, filePath, duration, createdAt
   - Supports audio file uploads for personalized voice generation

3. **Songs Table**: Generated songs with comprehensive metadata
   - Fields: id, userId, title, lyrics, genre, vocalStyle, tempo, songLength, voiceSampleId, generatedAudioPath, status, generationProgress, sections, settings, createdAt, updatedAt
   - Uses JSONB fields for flexible song sections and advanced settings storage

### Core Features
- **Song Generation**: Multi-step form for creating songs with lyrics, style, and voice preferences
- **Voice Recording**: Built-in voice recorder for capturing user voice samples
- **Audio Player**: Custom audio player with section-based navigation and playback controls
- **Generation Progress**: Real-time progress tracking for song generation process
- **Download Options**: Multiple format downloads for completed songs

### API Endpoints
- `POST /api/voice-samples` - Upload voice samples with file handling
- `GET /api/voice-samples/:userId` - Retrieve user's voice samples
- `DELETE /api/voice-samples/:id` - Remove voice samples
- Song management endpoints (implied from frontend usage)
- Download endpoints for generated songs

## Data Flow

1. **User Input**: Users provide lyrics, select musical parameters, and optionally upload voice samples
2. **Form Validation**: Client-side validation using Zod schemas ensures data integrity
3. **API Submission**: Validated data is sent to Express.js backend via REST endpoints
4. **Database Storage**: Song requests are stored in PostgreSQL with pending status
5. **Generation Process**: Background processing updates song status and progress
6. **Real-time Updates**: Frontend polls for progress updates using TanStack Query
7. **Completion**: Generated audio files are stored and made available for playback/download

## External Dependencies

### UI and Styling
- Radix UI components for accessible, unstyled primitives
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- Custom CSS variables for theming (dark mode support)

### Audio and Media
- Embla Carousel for media galleries
- Web Audio API integration (planned for voice analysis)
- Multer for file upload handling

### Development Tools
- Vite with React plugin for fast development
- ESBuild for production builds
- tsx for TypeScript execution
- Replit-specific plugins for development environment integration

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with PostgreSQL 16
- **Development Server**: Vite dev server with HMR on port 5000
- **Database**: Neon Database connection via DATABASE_URL environment variable

### Production Build
- **Build Process**: 
  1. Vite builds frontend assets to `dist/public`
  2. ESBuild bundles server code to `dist/index.js`
- **Deployment Target**: Autoscale deployment on Replit
- **Port Configuration**: Internal port 5000 mapped to external port 80

### Environment Configuration
- Database migrations managed via Drizzle Kit
- Environment variables for database connection
- File upload directory (`uploads/`) for audio storage

## Changelog

Changelog:
- June 17, 2025. Added PostgreSQL database with Drizzle ORM, replaced in-memory storage
- June 17, 2025. Extended song length options up to 5:30 minutes per user request
- June 16, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
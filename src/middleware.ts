import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Live Test (/test/**) and GameQuiz's live WS sessions (/gamequiz/join|host|play)
  // are deliberately NOT localized — they're real-time classroom tools, not
  // browsable content — so they're excluded here and stay outside [locale].
  // /go-backend and /uploads are next.config rewrites to the Go backend; if
  // the middleware saw them it would redirect them to /ru/go-backend/... (404),
  // breaking every client-side API call and uploaded image.
  matcher: [
    '/((?!api|go-backend|uploads|_next|_vercel|test|gamequiz/join|gamequiz/host|gamequiz/play|.*\\..*).*)',
  ],
}

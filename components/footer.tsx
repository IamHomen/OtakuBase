import Link from "next/link"
import Image from "next/image"
import { Github, Facebook, Youtube, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="OtakuBase Logo" width={40} height={40} className="rounded-full" />
              <h3 className="text-lg font-semibold">OtakuBase</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Your comprehensive source for anime information, powered by the AniList GraphQL API.
            </p>
            <div className="flex space-x-4">
              <Link href="https://github.com/IamHomen" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="https://www.facebook.com/otakubase1.0" target="_blank" rel="noopener noreferrer">
                <Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="https://www.youtube.com/@otakubase_111" target="_blank" rel="noopener noreferrer">
                <Youtube className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                <span className="sr-only">YouTube</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/trending" className="text-muted-foreground hover:text-foreground transition-colors">
                  Trending
                </Link>
              </li>
              <li>
                <Link href="/seasonal" className="text-muted-foreground hover:text-foreground transition-colors">
                  Seasonal
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="https://anilist.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  AniList
                </Link>
              </li>
              <li>
                <Link
                  href="https://anilist.gitbook.io/anilist-apiv2-docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  AniList API
                </Link>
              </li>
              <li>
                <Link
                  href="https://myanimelist.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  MyAnimeList
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Contact</h3>
            <p className="text-sm text-muted-foreground">Have questions or feedback? We'd love to hear from you!</p>
            <Link
              href="mailto:mail@mangaramen.xyz"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" />
              mail@mangaramen.xyz
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} OtakuBase. All rights reserved. Not affiliated with AniList or any anime
            production companies.
          </p>
          <p className="mt-2">
            Anime data provided by{" "}
            <Link
              href="https://anilist.co"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              AniList
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}

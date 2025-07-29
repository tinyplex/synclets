import type {NoPropComponent} from 'tinydocs';

export const Footer: NoPropComponent = () => (
  <footer>
    <nav>
      <a
        id="gh"
        href="https://github.com/tinyplex/synclets"
        target="_blank"
        rel="noreferrer"
      >
        GitHub
      </a>
      <a
        id="bs"
        href="https://bsky.app/profile/tinybase.bsky.social"
        target="_blank"
        rel="noreferrer"
      >
        Bluesky
      </a>
      <a
        id="tw"
        href="https://x.com/tinybasejs"
        target="_blank"
        rel="noreferrer"
      >
        X / Twitter
      </a>
      <a
        id="dc"
        href="https://discord.com/invite/mGz3mevwP8"
        target="_blank"
        rel="noreferrer"
      >
        Discord
      </a>
    </nav>
    <nav>
      <a href="/">
        Synclets <span id="version" />
      </a>{' '}
      © 2025-
    </nav>
  </footer>
);

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
        href="https://bsky.app/profile/synclets.bsky.social"
        target="_blank"
        rel="noreferrer"
      >
        Bluesky
      </a>
      <a
        id="tw"
        href="https://x.com/syncletsjs"
        target="_blank"
        rel="noreferrer"
      >
        X / Twitter
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

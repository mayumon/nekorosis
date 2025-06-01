---
title: "nekorosis' birth certificate"
date: "2025-03-01T00:00:00Z"
tags: ["life", "death"]
image: birth.png
---

# <span style="color:#ff0091">birth certificate</span>

nekorosis/n3korosis began development in february 20th, 2025 - though it has always been, in other forms.

## <span style="color:#ff0091">procedures</span>

### general

- added index skeleton (`index.html`)
- added font

### blog area
- added blog **skeleton** (`blog.html`, `blog.js`, `style.css`)
  - added basic blog script (pick and show)
  - added basic flex display
  - added blog img style
- added **post fetching** (`blog.js`)
  - added `posts.json` to keep track of posts (.md files) in blog_posts
    - adjusted to keep track of filename, title, date
    - added tags and tag filtering
    - adjusted to chronological order
    - **automatic posts.json generation**
      - posts.json generation script (`generate_posts.js`)
      - called upon commit through git hook
  - modified to github raw url post fetching
  - added **preview_mode** switch to view local posts, not repo posts (`config.js`)
    - automate preview_mode disabling upon commit (through git hooks calling `setup_pre_commit.js`)
    - added `setup_preview.js`, a script to quickly switch to preview mode

- **individual post features**
  - added markdown support
  - added post title formatting
  - added url change according to post
  - added simple chat/comment area
    - limited messages to 280 characters max
    - added tiny profile view
      - added username customization (20 characters max)
      - added username colour customization (4 colour options)

## <span style="color:#ff0091">dreams</span>

- visual concept?
  - add like symbols in front of posts?? uhh idk
- search bar
- start work on art/videos... areas - maybe add tags?? that would go crazy. wow.
- theres also the forum idea but tbh not something i really want to deal with myself. i think a chat is enough
- ensure chat messages are "clean" no script running
- bug catcher program
- add email + pw auth?
- blingees... blinkies.
- profile area to the right...?
  - picture
  - social media
  
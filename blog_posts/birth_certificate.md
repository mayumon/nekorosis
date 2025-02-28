# <span style="color:hotpink">birth certificate</span>

nekorosis/n3korosis began development in february 20th, 2025 - though it has always been, in other forms.

## <span style="color:hotpink">procedures</span>

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

## <span style="color:hotpink">dreams</span>

- comment area for every post

- date filter (newest first)
- search bar
- fix title formatting to allow more punctuation somehow
  - date to posts? on json and visually

- start work on art/videos... areas - maybe add tags?? that would go crazy. wow.

## <span style="color:hotpink">lame file documentation?</span>
  
# <span style="color:hotpink">birth certificate</span>

nekorosis/n3korosis began development in february 20th, 2025 - though it has always been in other forms.

## <span style="color:hotpink">procedures</span>

### general

- added skeleton index
- added font

### blog area
- added skeleton blog
- added basic blog script (pick and show)
- added basic flex display
- added blog img style
- added **post fetching**
  - added posts.json to keep track of posts (.md files) in blog_posts
    - **automatic posts.json generation**
      - posts.json generation script (generate-posts.js)
      - called upon commit through git hook
  - modified to github raw url post fetching
  - added **preview_mode** switch in blog.js to view local posts, not repo posts

- **individual post features**
  - added markdown support
  - added post title formatting
  - added url change according to post
    - modified to be reversible through link change

## <span style="color:hotpink">dreams</span>

- comment area
- date to posts? on json and visually
- date filter (newest first)
- search bar
- fix title formatting to allow more punctuation somehow
- automate preview_mode switch upon commit (through git hooks)
  
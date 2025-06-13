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
- added piano sidebar with animations
  - added clickable logo with animation

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
- added tag filtering for posts
- added floppy disk thumbnail post views 
  - added compact view mode
    - added animation
  - added grid view mode
    - added date display

- **individual post features**
  - added markdown support
  - added post title formatting
  - added url change according to post
  - added simple chat/comment area
    - limited messages to 280 characters max
    - added tiny profile view - changed to inline
      - added username customization (20 characters max)
      - added username colour customization (7 colour options)
    - added google sign-in
      - added saving username and colour combination to local storage
    - added adaptive text box for input
    - added ascii animation
    - added message deletion on hover + click
  - added return button
  

## <span style="color:#ff0091">dreams</span>



- chat fixes 
  - (DONE) ensure chat messages are "clean" no script running
  - (idea) ensure unique usernames (possible???)
  - (idea) change colour picking shape?
  - add user sheet in data?
  - add replying
  - add border...

- improve return button
- post bg and lace personalization (add variants...)

- (big) drawing/sticker guestbook
  - fields:
    - creature/thing pick
    - name
    - short message
    - a song?
    - the date
    - visitor number
  - rules
    - not too close to other's
    - i want the setup around it
    - (DONE) one per person... 
    - make visible if youre not signed in
    - add log out

  - (DONE) chat bubble.. thing on hover.
    - add border on border if possible?

  - add random icon at first
  - scene behind

  - (DONE) drag and drop
  
  - highlighting
  - customizing 
    - icons to replace:
      - coffee, soot sprite, korilakkuma sleeping both, korila w chick, rila w heart peek,
      - rila witch full bd, korila w umbrella, pudding, ponponpurin on phone duplicate,
      - ugly skeleton, ugly paw, ugly strawberry, ugly bat, all the white bears depending.
      - want: more sky things?
      - rework: smoke, korilla ghost
    
    - (in progress) bg 
      - places:
        - amusement park w carousel, cotton candy stand, ferris wheel, hopscotch
        - restaurant
        - alien ref, magic ref, bone ref,

- fix home url

- clean up birth certificate
  - floppy
  - title
  - beg for feedback

- (final touches) bug catcher club badge
- (final touches) drawing of me to introduce. ichirositas
- (final touches) hosting...
- (final touches, idea) hosting...

- (postponed) "newsletter" notif system
- (postponed) blingees... blinkies.
- (postponed, idea) add msg bleeppp
- (postponed,idea) search bar

- (future)
  - colouring pages
  - theater
  - nico nico cmmts
  - maid cafe
  - asciier
  - least commentable languages
  - dvd bouncing...
  - wii
  - seasons for the uh guestbook (chapters/episodes/volume/page/. now is birth day party)
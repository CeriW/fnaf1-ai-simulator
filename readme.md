# Five Nights At Freddy's AI simulator

I was inspired to make this simulator of how the AI in [Five Nights At Freddy's 1](https://store.steampowered.com/app/319510/Five_Nights_at_Freddys/) works after watching this Youtube video by Tech Rules, which reveals that the 'artificial intelligence' is really just a bunch of if statements based on random number generation: https://www.youtube.com/watch?v=ujg0Y5IziiY

That said, it was surprisingly difficult to do - each animatronic has its own different path around the building, different movement intervals and different criteria for whether they are able to move or not. Furthermore power consumption proved to be a _major_ difficulty to code, owing to the fact that none of the formulae found online matched up with what the game actually did. This required a lot of play testing on my part and I was eventually able to come up with an amended formula based on what others claimed that does seem to match what the game does.

At present I have no intention of making any other versions of this, but I did code it keeping in mind that I _could_ adapt it to work with other games in the series.

## The brief

- [How the game works](https://github.com/CeriW/fnaf-but-boring/blob/b19f53be151db013c89aa0b1a235db43eb26e668/research/how-the-game-works.md)
- [How sound works](https://github.com/CeriW/fnaf-but-boring/blob/f3a45f81cb06bf874548392b5d1db36a9201e055/research/how-sound-works.md)

## Tech

- Typescript
- LESS
- Pug (formerly Jade)
- Markdown
- Compiled locally using [Prepros](https://prepros.io/)
- Hosted using Github pages

Since I started this project I have become familiar with React, and the idea of doing this the way that I have seems crazy, with all of the direct DOM manipulation and global variables to control the state. I do not necessarily consider this a bad thing though - if you don't look back on old projects and think you could do it better if you did it again, you have not grown as a developer.

Pug and LESS were new to me and I used this project to try them out. I don't think I'm converted, and will likely stick to my HTML and SCSS, but it was interesting to get a feel for them.

I was already familiar with Typescript but had not used it on a front end project before. I was shocked by how many times I had to tell it "trust me, I'm 100% sure this HTML element exists".

I also used this project as an excuse to get a little more familiar with markdown and wrote all of my research in it.

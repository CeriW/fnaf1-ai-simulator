The vast majority of details in this document are taken from this Youtube video by Tech Rules: https://www.youtube.com/watch?v=ujg0Y5IziiY
, with a small amount based on my own play testing.

"Five Nights at Freddy's" is a popular indie horror game developed created by Scott Cawthon in 2014. The game is set in a fictional pizza restaurant called "Freddy Fazbear's Pizza", where the player takes on the role of a night security guard. The main selling point of the pizzeria is a group of 4 animatronic characters (Freddy, Chica, Bonnie and Foxy) who perform on stage during the day. Unfortunately due to supernatural forces these animatronics are intent on killing any security guards on staff at night. As the security guard, the player must monitor security cameras, conserve limited power, and close security doors to survive five nights, and avoid being attacked by the animatronics.

Each night begins at 12AM and ends at 6AM. 12AM lasts 90 real-life seconds, while 1AM - 6AM each last 89 seconds each hour, meaning a night lasts 8:55.

# How AI levels work

Each animatronic has an AI level which determines how likely they are to take an action at any given time, ranging from 0 (completely deactivated) to 20 (maximum aggression, guaranteed to move). These are:

| Character | Night 1 | Night 2 | Night 3 | Night 4 | Night 5 | Night 6 |
| --------- | ------- | ------- | ------- | ------- | ------- | ------- |
| Freddy    | 0       | 0       | 1       | 1 or 2  | 3       | 4       |
| Bonnie    | 0       | 3       | 0       | 2       | 5       | 10      |
| Chica     | 0       | 1       | 5       | 4       | 7       | 12      |
| Foxy      | 0       | 1       | 2       | 6       | 5       | 16      |

However, their AI levels increase cumulatively throughout the night (which is why stuff happens on night 1 even though they all start out at level 0):

- At 2AM, Bonnie goes up 1 AI level.
- At 3AM, Bonnie, Chica and Foxy all go up 1 AI level.
- At 4AM, Bonnie, Chica and Foxy all go up another 1 AI level

This means that, for example, at the end of night 1 the AI levels are 0,3,2,2, and at the end of night 6 the AI levels are 4,13,14,18.

Freddy does not receive any boosts throughout the night.

## How AI levels are used

Every so many seconds, each animatronic has a 'movement opportunity'. These AI levels determine whether the animatronic in question will be successful in making the move it wants to make.

The game will pick a random number between **1 and 20**. This number is compared to the animatronic's AI level. If the AI is **greater than or equal to** the random number, the animatronic will successfully make whatever action it was wanting to do.

This means at AI level 0, it is impossible for the animatronic to move. At AI level 1, it has a 1 in 20 (5%) chance of moving, at AI level 2 it has a 2 in 20 (10%) chance, all the way up to AI level 20 where it is _guanteed_ to make every movement it wants to make. In a way this makes the AI levels leading up to 20 harder than level 20 itself - at level 20 you can predict with absolute certainty when the animatronic will act next, whereas at the slightly lower levels there is an element of uncertainty - you know when they are _probably_ going to move, but you could be wrong.

Each animatronic has different amounts of time between each of their movement opportunities:

| Animatronic | Time  |
| ----------- | ----- |
| Freddy      | 3.02s |
| Bonnie      | 4.97s |
| Chica       | 4.98s |
| Foxy        | 5.01s |

This means that the animatronics are not in sync with each other, and also explains why Freddy does not feel less aggressive despite his generally lower AI levels - he gets movement opportunities far more often than the other animatronics.

# Power usage

The following information was deduced by my own experience. I spent quite some time researching online exactly how power worked, and there was a lot of conflicting information. I tried various existing theories and did the maths it just wasn't working - it did not match up to what happened in game. Here is what I believe happens - my code works this way and it seems consistent with power drain when compared to the game:

You start with 99% power, and this drains throughout the night.

By default, the player will lose X amount of power every 0.1 seconds. X is calculated as such:

How many of these are true, up to a maximum of 4:

- left door is closed
- right door is closed
- cameras are on
- left light is on
- right light is on

If none of these are true, X is 1.

Examples:

- Left door is closed, cameras are on = 2
- No doors/cameras/lights active = 1
- Both doors closed, both lights on, cameras off = 4
- Both doors closed, both lights on, cameras on = 4

Divide this number by 10.

Examples:

- Left door is closed, cameras are on = 0.2
- No doors/cameras/lights active = 0.1
- Both doors closed, both lights on, cameras off = 0.4
- Both doors closed, both lights on, cameras on = 0.4

On top of this, additional power is lost depending on what night the player is on:

| Night        | Amount    |
| ------------ | --------- |
| 1            | 0.1 / 9.6 |
| 2            | 0.1 / 6   |
| 3            | 0.1 / 5   |
| 4            | 0.1 / 4   |
| 5            | 0.1 / 3   |
| 6            | 0.1 / 3   |
| Custom night | 0.1 / 3   |

These two numbers are added together to calculate how much power the player loses every 0.1 seconds, divided by 10.

## Examples:

- Base power loss: left door is closed, cameras are on: 2/10 = 0.2
- Night 1 - nightly debuff power loss - 0.1 / 9.6 = 0.0104166
- Night 6 - nightly debuff power loss - 0.1 / 3 = 0.03
- Night 1 total power loss every 0.1 seconds: (0.2 + 0.0104166) / 10 = 0.02104166 (equivalent to 0.2104166% every 1 second)
- Night 6 total power loss every 0.1 seconds: (0.2 + 0.03) / 10 = 0.023 (equivalent to 0.23% every 1 second)

---

- Base power loss: Both doors closed, both lights on, cameras on: 4/10 = 0.4
- Night 1 - nightly debuff power loss - 0.1 / 9.6 = 0.0104166
- Night 6 - nightly debuff power loss - 0.1 / 3 = 0.03 (equivalent to 0.3% every 1 second)
- Night 1 total power loss every 0.1 seconds: (0.4 + 0.0104166) / 10 = 0.0410416 (equivalent to 0.4166% every 1 second)
- Night 6 total power loss every 0.1 seconds: (0.4 + 0.03) / 10 = 0.043 (equivalent to 0.43% every 1 second)

---

A game lasts a maximum of 535 seconds.

# How the animatronics work

Freddy, Chica and Bonnie all move around during the night, generally getting closer to your office. Once they are at their final destination they will not jumpscare you right away, but rather they will wait for you to put up the cameras.

## Chica

Always shows up at the **right** door. You can prevent her from entering by closing the door. She will eventually go somewhere else.

Each time Chica gets a "movement opportunity" she will randomly chose an adjacent room on the right side of the building.

Once Chica is outside your door, she will attempt to get inside the office at her next successful movement opportunity.

- If the door is closed, she will return to the dining room.
- If the door is not closed, she will enter the office, the door will be disabled and you will be jumpscared the next time you bring the cameras down. You cannot cheat by keeping the cameras up - after 30 seconds you will be jumpscared regardless.

In a way this makes AI level 20 easier than the AI levels leading up to it. If your door is closed you are guaranteed that they will move back to the dining room on their next movement opportunity. At lower levels, they can repeatedly fail, meaning they stay outside your office, forcing you to drain the power by keeping your door closed.

## Bonnie

Always shows up at the **left** door.

Each time Bonnie gets a "movement opportunity" he will choose a random location anywhere on the left side of the building. It does not have to be adjacent to where he currently is.

Once Bonnie is outside your door, he will attempt to get inside the office at his next successful movement opportunity.

- If the door is closed, he will return to the dining room.
- If the door is not closed, he will enter the office, the door will be disabled and you will be jumpscared the next time you bring the cameras down. You cannot cheat by keeping the cameras up - after 30 seconds you will be jumpscared regardless.

In a way this makes AI level 20 easier than the AI levels leading up to it. If your door is closed you are guaranteed that they will move back to the dining room on their next movement opportunity. At lower levels, they can repeatedly fail, meaning they stay outside your office, forcing you to drain the power by keeping your door closed.

## Freddy

Always comes down the **right** corridor. Unlike Bonnie and Chica his progress will not reverse - he will always come towards you and never away from you.

Once he is in the space immediately outside your **right** door, he will wait until you have the cameras up. If your door is open at this time, you will be jumpscared once you put the cameras down.

Having the cameras up (on any camera, not specifically the one Freddy is in) while he is calculating a movement opportunity will cause him to automatically fail it.

However, when Freddy _does_ get a successful movement opportunity he does not immediately move, but rather waits a certain number of _frames_ (remembering that the game runs at 60fps) before doing so. How many frames this is depends on his AI level.

This is calculated as:

```
1000 - (100 * AI level)
```

This effectively means that he waits this amount of time at each AI level before moving:
| AI level | Frames | Equivalent time |
| -------- | ------ | --------------- |
| 1 | 900 | 15s |
| 2 | 800 | 13.337s |
| 3 | 700 | 11.667s |
| 4 | 600 | 10s |
| 5 | 500 | 8.337s |
| 6 | 400 | 6.667s |
| 7 | 300 | 5s |
| 8 | 200 | 3.337s |
| 9 | 100 | 1.667s |
| 10+ | 0 | 0s |

If he is already in a countdown and you put the cameras back up this countdown will not be affected - he will take it as soon as you put the cameras down.

Freddy is unable to leave the stage while Bonnie and/or Chica are still there. This means that even if you set the AI levels to 20/0/0/0, Freddy wouldn't be able to leave the stage until just after 3AM - when Bonnie and Chica have both had AI boosts and can leave the stage.

### Freddy's path

There is no element of randomness to Freddy's movements - he always follows a set path.

- Cam 1A
- Cam 1B
- Cam 7
- Cam 6
- Cam 4A
- Cam 4B

### Freddy at camera 4B

Freddy's behaviour changes when he's at camera 4B - the one immediately outside your office.

- He will no longer automatically fail his movement opportunities when the cameras are up.
- There is an exception - looking at camera 4B will continue to make him fail his movement opportunities.

He will attack when both of these conditions are met:

- He succeeds a movement opportunity
- The cameras are up and you are looking at a camera that isn't 4B

### How Freddy differs to Bonnie and Chica

- Freddy cannot enter your office when your camera is down. He can only enter while you are looking at a camera that isn't 4B while the doors are open.
- Once he is outside your office, he pretty much never leaves. If he gets a successful movement opportunity while at 4B and the door is closed, he moves back to 4A rather than all the way back to the dining room.
- Once Freddy is inside your office, he will only jumpscare you when the camera is down. Unlike Bonnie and Chica, he will not pull the camera down if you spend too long in it - you could theoretically win by never putting the camera down once he's inside.
- While the cameras _are_ down, his chances of jumpscaring you are 25% every 1 second (meaning theoretically he could be in your office and never jumpscare you).

## Foxy

Moves from the stage in Pirate's Cove as a result of poor camera usage. Despite common belief, you don't actually have to look at the cameras specifically in Pirate's Cove - camera usage of any kind is enough to stop Foxy from moving.

If he is able to leave Pirate's Cove, he will rush down the **left** corridor at you.

- If the door is open at this time, he will jumpscare you.
- If the door is closed, he will bash on it, causing you to lose power. This power drainage is 1% the first time he does it, and increases by 5% each time after that.
- Once he has bashed on your door and drained your power he will return to Pirate's Cove and restart his cycle at either step 1 or 2.

Each successful "movement opportunity" (see _How AI levels are used_ below) Foxy gets means he gets 1 step closer to attacking. However, while the cameras are up (on any camera, not specifically the one in Pirate's Cove), he will automatically fail **all** of his movement opportunities.

He will continue to fail all of his movement opportunities for a random amount of time after the cameras come down, ranging from 0.83s to 16.67s (calculated on each frame at 60fps).

Once Foxy makes 3 successful movement opportunities he will attack as soon as he can, which will either be when you next check the camera for the right hall (giving you a very short amount of time to shut the door before you get jumpscared), or after 25s has passed.

## Golden Freddy

There is a 0.0001% chance of the Golden Freddy poster appearing every time camera 2B is clicked. This is calculated once per second - reopening camera 2B more than once per second does not increase your chances.

When you put the camera down, he will be sitting in your office. If you do not put the cameras back up within ? seconds, you will be jumpscared.

If you put the camera up and then back down again, he will be gone.

# What happens when you run out of power

Everything else stops. You cannot use lights or cameras, and the doors are open. The only animatronic you can be jumpscared by is Freddy. Even if someone was already in your office or Foxy was on his way, none of it matters now.

1. Every 5 seconds, you have a 20% chance of Freddy showing up outside the **left** door and start playing his song, up to a maximum of 20 seconds, after which he is guaranteed to show up.
2. The same thing then happens for how long the song lasts - a 20% chance up to a maximum of 20 seconds.
3. The lights go off, and you have a 20% chance every 2 seconds for him to jumpscare you.

This means it can theoretically be 40+ seconds between the time the power runs out and you actually being jumpscared - long enough that you could pass 6AM in the meantime.

Despite common belief, not moving does not slow down the time you have before Freddy attacks you.

# HOW FIVE NIGHTS AT FREDDY'S WORKS

All details in this document are taken from this Youtube video by Tech Rules: https://www.youtube.com/watch?v=ujg0Y5IziiY

# HOW AI LEVELS WORK

Each animatronic has an AI level which determines how likely they are to take an action at any given time, ranging from 0 (completely deactivated) to 20 (maximum aggression, guaranteed to move). These are:


| Character   | Night 1 | Night 2 | Night 3 | Night 4 | Night 5 | Night 6 | 
| ----------- | ------- | ------- | ------- | ------- | ------- | ------- |
| Freddy      | 0       | 0       | 1       | 1 or 2  | 3       | 4       |
| Bonnie      | 0       | 3       | 0       | 2       | 5       | 10      |
| Chica       | 0       | 1       | 5       | 4       | 7       | 12      |
| Foxy        | 0       | 1       | 2       | 6       | 5       | 16      |


However, their AI levels increase cumulatively throughout the night (which is why stuff happens on night 1 even though they all start out at level 0):
* At 2AM, Bonnie goes up 1 AI level.
* At 3AM, Bonnie, Chica and Foxy all go up 1 AI level.
* At 4AM, Bonnie, Chica and Foxy all go up another 1 AI level

This means that, for example, at the end of night 1 the AI levels are 0,3,2,2, and at the end of night 6 the AI levels are 4,13,14,18.

Freddy does not receive any boosts throughout the night.

TODO - IS THIS STILL THE CASE FOR CUSTOM NIGHT OR DO THEY REMAIN WHERE YOU SET THEM?

## HOW AI LEVELS ARE USED

Every so many seconds, each animatronic has a 'movement opportunity'. These AI levels determine whether the animatronic in question will be successful in making the move it wants to make.

The game will pick a random number between **1 and 20**. This number is compared to the animatronic's AI level. If the AI is **greater than or equal to** the random number, the animatronic will successfully make whatever action it was wanting to do.

This means at AI level 0, it is impossible for the animatronic to move. At AI level 1, it has a 1 in 20 (5%) chance of moving, at AI level 2 it has a 2 in 20 (10%) chance, all the way up to AI level 20 where it is *guanteed* to make every movement it wants to make. In a way this makes the AI levels leading up to 20 harder than level 20 itself - at level 20 you can predict with absolute certainty what the animatronic will do next, whereas at the slightly lower levels there is an element of uncertainty - you know what they are *probably* going to do next, but you could be wrong.

Each animatronic has different amounts of time between each of their movement opportunities:

| Animatronic | Time  |
| ----------- | ----  |
| Freddy      | 3.02s |
| Bonnie      | 4.97s |
| Chica       | 4.98s |
| Foxy        | 5.01s |

This means that the animatronics are not in sync with each other, and also explains why Freddy does not feel less aggressive despite his generally lower AI levels - he gets movement opportunities far more often than the other animatronics.


# Power usage

You start with 99% power, and this drains throughout the night.

Not taking into account any actions you take which drain additional power (cameras, doors, lights), you lose:

| Night | Power |
| ----  | ----- |
| 1 | ? |
| 2 | 1% every 6 seconds |
| 3 | 1% every 5 seconds |
| 4 | 1% every 4 seconds |
| 5+, including custom night | 1% every 3 seconds |


# How the animatronics work

When using "left" and "right" in this document, this will be from the point of view of the player sat in the security office.

Freddy, Chica and Bonnie all move around during the night, generally getting closer to your office. Once they are at their final destination they will not jumpscare you right away, but rather they will wait for you to put up the cameras.


## Chica
Always shows up at the **right** door. You can prevent her from entering by closing the door. She will eventually go somewhere else.

Each time Chica gets a "movement opportunity" she will randomly chose an adjacent room on the right side of the building.

Once Chica is outside your door, he will attempt to get inside the office at her next successful movement opportunity.
* If the door is closed, she will return to the dining room.
* If the door is not closed, she will enter the office, the door will be disabled and you will be jumpscared the next time you bring the cameras down. You cannot cheat by keeping the cameras up - after 30 seconds you will be jumpscared regardless.

In a way this makes AI level 20 easier than the AI levels leading up to it. If your door is closed you are guaranteed that they will move back to the dining room on their next movement opportunity. At lower levels, they can repeatedly fail, meaning they stay outside your office, forcing you to drain the power by keeping your door closed.



## Bonnie
Always shows up at the **left** door. 

Each time Bonnie gets a "movement opportunity" he will choose a random location anywhere on the left side of the building. It does not have to be adjacent to where he currently is.

Once Bonnie is outside your door, he will attempt to get inside the office at his next successful movement opportunity.
* If the door is closed, he will return to the dining room.
* If the door is not closed, he will enter the office, the door will be disabled and you will be jumpscared the next time you bring the cameras down. You cannot cheat by keeping the cameras up - after 30 seconds you will be jumpscared regardless.

In a way this makes AI level 20 easier than the AI levels leading up to it. If your door is closed you are guaranteed that they will move back to the dining room on their next movement opportunity. At lower levels, they can repeatedly fail, meaning they stay outside your office, forcing you to drain the power by keeping your door closed.


## Freddy
Always comes down the **left** corridor. Unlike Bonnie and Chica his progress will not reverse - he will always come towards you and never away from you.

Once he is in the space immediately outside your **left** door, he will wait until you have the cameras up. If your door is open at this time, you will be jumpscared once you put the cameras down.

Having the cameras on Freddy while he is calculating a movement opportunity will cause him to automatically fail it.

However, when Freddy *does* get a successful movement opportunity he does not immediately move, but rather waits a certain number of *frames* (remembering that the game runs at 60fps) before doing so. How many frames this is depends on his AI level.

This is calculated as:
~~~~
1000 - (100 * AI level)
~~~~

This effectively means that he waits this amount of time at each AI level before moving:
| AI level | Frames | Equivalent time |
| -------- | ------ | --------------- |
| 1  |  900  | 15s |
| 2  |  800  | 13.337s |
| 3  |  700  | 11.667s |
| 4  |  600  | 10s |
| 5  |  500  | 8.337s |
| 6  |  400  | 6.667s |
| 7  |  300  | 5s |
| 8  |  200  | 3.337s |
| 9  |  100  | 1.667s |
| 10+  |  0  | 0s |

Despite common belief, if you run out of power, not moving does not slow down the time you have before Freddy attacks you.


## Foxy
Moves from the stage in Pirate's Cove as a result of poor camera usage. Despite common belief, you don't actually have to look at the cameras specifically in Pirate's Cove - camera usage of any kind is enough to stop Foxy from moving.

If he is able to leave Pirate's Cove, he will rush down the **left** corridor at you.
* If the door is open at this time, he will jumpscare you.
* If the door is closed, he will bash on it, causing you to lose power. This power drainage is 1% the first time he does it, and increases by 6% each time after that.
* Once he has based on your door and drained your power he will return to Pirate's Cove and restart his cycle at either step 1 or 2

Each successful "movement opportunity" (see *How AI levels are used* below) Foxy gets means he gets 1 step closer to attacking. However, while the cameras are up (on any camera, not specifically the one in Pirate's Cove), he will automatically fail **all** of his movement opportunities.

He will continue to fail all of his movement opportunities for a random amount of time after the cameras come down, ranging from 0.83s to 16.67s (calculated on each frame at 60fps).

Once Foxy makes 4 successful movement opportunities he will attack as soon as he can, which will either be when you next check the camera for the left hall (giving you a very short amount of time to shut the door before you get jumpscared), or after 25s has passed.

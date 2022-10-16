# WebRTC-Demo

--sten:

encode:
input: arr pointer, text, id, part
output: object with params -
-'str' - the reminder string that hasn't inserted into the frame(the string we need hide)
-'id' - identifier of a massage
-'part' - counter of the current part of the massage(from 0-255)
-'is_end' - is this the final part of the massage (stop waiting for other frames)

we always will hide using the two bits of the color

the process of the encoding working like that:
-hide the flag(24 bits) without cell skips(cells 0-16)
-hide the id(16 bits) without cell skips
-hide the frame number of the massage(part) (8 bits(0-255))
-hide the bit counter of the massage (32 bits)

after we start to hide the main text massage -
we will hide by chars - if char doesnt fit we wont insert it
we will use skips of some kind of base(in this case base 4 (1-4))
we will use hash_handler to get always a number of steps to skips cells

after that we will(unnecessary we can hide a one bit) hide a flag:
the starting flag if the massage ends in this part
the remain flag if the massage dowsn't end in this part

decode:
input: arr pointer
output: object with params -
-'str' the string we decoded
-'id'- id
-'part' - part
-'is_end' - if the massage end in this frame or part

we will check the flag first - return -1 if not
get the id, part, bit counter

after that start decoding the main text
using hash_handler with the same string to get the cells to get the data from

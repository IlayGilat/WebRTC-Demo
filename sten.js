


const rgb = {0: 'r', 1: 'g', 2:'b', 3:'a'}
const buffer = "100110011001100110011001"



function foo() {
    console.log('lma1o')
}

async function SHA256_handler(string) {
    if(typeof string === "string"){
        res = await CryptoJS.SHA256(string).toString(Hex)
        
    }
    return -1   
}


//rgba arr


let str_to_bin = (text) => {

}

let bin_to_str = () => {

}



let decrypt = () => {

}

let lsb = (num) => {
    if(typeof num === "number"){
        return num%2
    }
    return -1
}

//start = main_index*4+color_index(0-3)
//arr - the arr is huge so we will slice
let insertBuffer = (arr, start) => {
    let buff_p = 0;
    let i,color
    let index = next(start,0)

    for(buff_p;buff_p<buffer.length; buff_p = buff_p+2){
        if(index >= arr.length*4)
            return -1
        let val
        if(buff_p+1<buffer.length)
            val = get_value(arr[Math.floor(index/4)][rgb[index%4]], parseInt(buffer.substring(buff_p, buff_p+2),2),4)
        else
            val = get_value(arr[Math.floor(index/4)][rgb[index%4]], parseInt(buffer.charAt(buff_p),2),2)
        
        arr[Math.floor(index/4)][rgb[index%4]] = val
        index = next(index,1)
    }

    return arr

}


let get_value = (num, val, base) => {
    
    return num - num%base + val

}


//start = main_index*4+color_index(0-3)
//end = end_index*4+color_index(0-3)+1
 
let distance = (start, end,bits) => {
    let reminder_start = start%4
    let reminder_end = end%4
    let new_start = start - reminder_start
    let new_end = end - reminder_end
    //new start and new end points on the first color of the selected pixel. they can be devided by 4
    let res = (new_end-new_start)*(3/4)- reminder_start+ reminder_end

    return bits* res
}


//steps>=0
let next = (index, steps) => {
    if(steps === 0){
        if(index%4<3){
            return index
        }
        return index+1
    }

    
    let new_index = index - index%4
    let steps_remain = steps + index%4
    if(index%4 === 3){
        steps_remain --
    }

    let res = new_index + Math.floor(steps_remain/3)*4 + steps_remain%3
    //middle and tail part
    //new_index = new_index + Math.floor(steps_remain/3)*4 + steps_remain%3
    return res

}

let encrypt = (arr, text = ' ') => {
    let bin_str = text.split('').map(char => {
        return char.charCodeAt(0).toString(2);
     }).join(' ').split(' ');

    if(distance(0,arr.length*4,1)<buffer.length)
        return -1

    let index_after_buffer = next(0,Math.floor(buffer.length/2)+buffer.length%2)
    let end_index = Math.floor(index_after_buffer/4)+1
    if(index_after_buffer%4>0){
        end_index++
    }  

    let sliced = arr.slice(0,end_index)
    let buffered_sliced_array = insertBuffer(sliced,0)
    console.log("sliced: ",sliced)
    console.log("buffered: ",buffered_sliced_array)

}

const arr = []
for(let i=0;i<100;i++){
    const rgba = {
        r: Math.floor(100+Math.random()*156),
        g: Math.floor(100+Math.random()*156),
        b: Math.floor(100+Math.random()*156),
        a: Math.floor(100+Math.random()*156)
      };
    arr.push(rgba);

}

console.log(encrypt(arr,"hello"))

import {hash_handler} from './hash_handler'


const rgb = {0: 'r', 1: 'g', 2:'b', 3:'a'}
const buffer = "100110011001100110011001"
const hash_hex = SHA256_handler("abcdefgh")
const bits = 2
const base = 4


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

//bits_n = 1 or 2
let pixels_counter = (start,size,bits_n) =>{
    
    if(bits_n>2 || bits_n<1){
        return -1
    }
    let after
    if(bits_n ==2){
        after = next(start,Math.floor(size/2)+size%2)
    }
    else{
        after = next(start,size)
    }
    let end_pixel = Math.floor(after/4)
    let start_pixel = Math.floor(start/4)
    if(after%4==0){
        end_pixel--
    }
    


    return end_pixel - start_pixel + 1
    
}


//start = main_index*4+color_index(0-3)
//arr - the arr is huge so we will slice
//we will write the buffer on the array usin two bits of the end of the array, because buffer need to defrentiate regular photo to sten one
let insertBuffer = (arr, start) => {
    let buff_p = 0;
    let i,color
    let index = next(start,0)

    for(buff_p;buff_p<buffer.length; buff_p = buff_p+2){
        if(index >= arr.length*4)
            return -1
        let val
        if(buff_p+1<buffer.length)
            val = set_value(arr[Math.floor(index/4)][rgb[index%4]], parseInt(buffer.substring(buff_p, buff_p+2),2),4)
        else
            val = set_value(arr[Math.floor(index/4)][rgb[index%4]], parseInt(buffer.charAt(buff_p),2),2)
        
        arr[Math.floor(index/4)][rgb[index%4]] = val
        index = next(index,1)
    }

    return arr

}
let checkBuffer = (arr,start) => {
    let index=start
    for(let i=0;i<buffer.length;i=i+2){
        let val
        if(i+1<buffer.length)
        {
            val = get_value(arr[Math.floor(index/4)][rgb[index%4]],4)
            if(val!=parseInt(buffer.substring(i,i+2),2)){
                return -1
            }
        }
        else{
            val = get_value(arr[Math.floor(index/4)][rgb[index%4]],2)
            if(val!=parseInt(buffer.charAt(i),2)){
                return -1
            }
        }
        index = next(index,1)
            
    }

    return 1
}
//set a value according to the base given
let set_value = (num, val, base) => {
    
    return num - num%base + val

}

//get the value that in the num
let get_value = (num,base) =>{
    return num%base
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




    //buffer    
    let index_after_buffer = next(0,Math.floor(buffer.length/2)+buffer.length%2)
    let end_index = Math.floor(index_after_buffer/4)+1

    if(index_after_buffer%4>0){
        end_index++
    }  

    let sliced = arr.slice(0,end_index)
    let buffered_sliced_array = insertBuffer(sliced,0)
    //end buffer


    //main
    let hash = new hash_handler(hash_hex)
    let sten_index = next(index_after_buffer, 32)
    let bit_counter = 0
    for(let str_p=0;str_p<bin_str.length &&  distance(next(sten_index,1),arr.length*4) >= b_plcaces ;str_p=str_p+bits)
    {
        let val
        if(str_p+1<bin_str.length){
            val = set_value(arr[Math.floor(sten_index/4)][rgb[sten_index%4]], parseInt(bin_str.substring(str_p, str_p+2),2),4)
            bit_counter = bit_counter+2
        }
        else{
            val = set_value(arr[Math.floor(sten_index/4)][rgb[sten_index%4]], parseInt(bin_str.charAt(str_p),2),2)
            bit_counter++
        }
        arr[Math.floor(sten_index/4)][rgb[sten_index%4]] = val
        sten_index = next(sten_index,hash.next())
    }
    //end main


}
let decrypt = (arr) => {
    let after_buffer = next(0,Math.floor(buffer.length/2)+buffer.length%2)
    let end_pixel = Math.floor(after_buffer/4)
    if(after_buffer%4>0){
        end_pixel+1
    }

    let sliced_start = arr.slice(0)
}




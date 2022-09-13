
const rgb = {0: 'r', 1: 'g', 2:'b', 3:'a'}
const buffer = "100110011001100110011001"


function foo() {
    console.log('lmao')
}

async function SHA256_handler(string) {
    if(typeof string === "string"){
        res = await CryptoJS.SHA256(string).toString(CryptoJS.enc.Hex)
        
    }
    return -1   
}


//rgba arr
let encrypt = (arr, text = ' ') => {
    let res = text.split('').map(char => {
        return char.charCodeAt(0).toString(2);
     }).join(' ').split(' ');
    console.log(res)
    

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
let insertBuffer = (arr, start) => {
    let buff_p = 0;
    let i,color
    




    for(i=start;i<arr.length; i+4){
        
        for(color =0 ; color < 3; color ++){
            new_val = get_value(arr[i][arg[color]], Number(buffer.charAt(buff_p)))
            if(new_val){
                arr[i][arg[color]] = new_val
            }
        }
    }

    return arr//start + buffer
    
    

}


let get_value = (num, bitVal) => {
    let lsb = lsb(num)
    if(lsb==bitVal){
        return num
    }
    if(lsb == 1){
        return num-1
    }
    if(lsb == 0){
        return num+1
    }
    return null
}


//start = main_index*4+color_index(0-3)
//end = end_index*4+color_index(0-3)+1
 
let distance = (start, end) => {
    let reminder_start = start%4
    let reminder_end = end%4
    let new_start = start - reminder_start
    let new_end = end - reminder_end
    //new start and new end points on the first color of the selected pixel. they can be devided by 4
    let res = (new_end-new_start)*(3/4)- reminder_start+ reminder_end

    return res
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
    if(index%4 == 3){
        steps_remain --
    }

    let res = new_index + Math.floor(steps_remain/3)*4 + steps_remain%3
    //middle and tail part
    //new_index = new_index + Math.floor(steps_remain/3)*4 + steps_remain%3
    return res

}

export { foo, SHA256_handler, encrypt};






//hash('foo').then((hex) => console.log(hex)); 
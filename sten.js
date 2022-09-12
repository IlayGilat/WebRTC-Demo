
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



let canFit = (start, arrLength, size) => {
    let counter = 0
    let new_start = start
    if(start%4==1)
        counter = 2
    elif(start%4==2)
        counter = 1
    
    if(start%4 != 0)
        new_start = start + (4-start%4)
    
    



}

export { foo, SHA256_handler, encrypt};






//hash('foo').then((hex) => console.log(hex)); 
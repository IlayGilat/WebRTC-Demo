
//I want that this handler with with a created sha256 hash to give a base4 value of steps for the sten module

class hash_handler{

    constructor(hex_str, base){
        this.hex_str = hex_str
        this.pointer = 0
        let integer = parseInt(hex_str,16)
        this.base_str = integer.toString(base)
        this.base = base
    }

    next(){
        if(this.base <= 0 || this.base_str == null)
            return 0
       
        if(this.pointer>=this.base_str.length)
            this.pointer = 0
        
        if(this.pointer < 0)
            this.pointer = 0

        
        if(this.pointer < this.base_str.length && this.pointer>=0){
            let integer = parseInt(this.base_str.charAt(this.pointer), this.base)
            this.pointer = (this.pointer+1)%this.base_str.length
            return integer
        }
    }
}
//not done

export {hash_handler}





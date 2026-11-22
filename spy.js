let ownerName = "CHANGE THIS TO YOUR NAME"
let lenLimit = 2000
let lastMsg = ""
let lastName = ""
let structures = {
    m:["message","timestamp","last sender","last message","message"],
    m2:["message","timestamp","last sender","last message","sender","message"],
    j:["join","timestamp","lobby name","player name"],
    l:["leave","timestamp","last sender","last message"],
    l2:["leave","timestamp","last sender","last message","player name"],
}
onPlayerChat=(pid,msg)=>{
    let name = api.getEntityName(pid)
    let pack = ["m",Date.now(),lastName,lastMsg,msg]
    let pack2 = ["m2",Date.now(),lastName,lastMsg,name,msg]
    addToPlayer(pid,pack)
    addToLobby(pack2)
    lastMsg = msg
    lastName = name
}
onPlayerJoin=pid=>{
    let name = api.getEntityName(pid)
    let pack = ["j",Date.now(),api.getLobbyName(),name]
    addToPlayer(pid,pack)
}
onPlayerLeave = pid => {
    let name = api.getEntityName(pid)
    let pack = ["l",Date.now(),lastName,lastMsg]
    let pack2 = ["l2",Date.now(),lastName,lastMsg,name]
    addToPlayer(pid,pack)
    addToLobby(pack2)
}
playerCommand = (pid,cmd) => {
    if(cmd.startsWith("spy")){
        if(api.getEntityName(pid)!==ownerName) return
        let pName = cmd.slice(3).trim()
        let lowerPName = pName.toLowerCase()
        let val
        if(!pName){
            val = api.getLobbyDbValue("|INF0|")
        } else {
            let spied = api.getPlayerIds().find(id=>api.getEntityName(id).toLowerCase()===lowerPName)
            if(!spied){
                send(pid,"No player found with name "+pName,"#ff0")
                return true
            }
            val = api.getPlayerDbValue(spied,"|INF0|")
        }
        let sendInfo = "Info:\n"+decode(val).map(a=>{
            let dec = decode(a)||[]
            let type = dec?.[0]||""
            let structure = structures?.[type]||[]
            let str = structure?.[0]||""
            for(let i = 1; i < structure.length; i++){
                try{str += "\n"+structure[i]+": "+dec[i]}catch{}
            }
            return str
        }).join("\n\n")
        send(pid,sendInfo,"#ff0")
        return true
    }
}
let send=(pid,str,color)=>(str.match(/[^]{1,2000}/g)||[]).forEach(str=>api.sendMessage(pid,str,{color}))
let addToPlayer = (pid,pack) => {
    let str = api.getPlayerDbValue(pid,"|INF0|")
    let newStr = update(str,encode(pack))
    api.setPlayerDbValue(pid,"|INF0|",newStr)
}
let addToLobby = (pack) => {
    let str = api.getLobbyDbValue("|INF0|")
    let newStr = update(str,encode(pack))
    api.setLobbyDbValue("|INF0|",newStr)
}
let update = (prev,add,maxLen=lenLimit*0.95) => {
    let arr = decode(prev)
    arr.push(add)
    let newStr = encode(arr)
    while(JSON.stringify(newStr.length)>maxLen){
        arr.shift()
        newStr = encode(arr)
    }
    return newStr
}
let decode = enc => {
    enc||=""
    let dec = []
    let str = ""
    let escaped = false
    for(let i = 0; i < enc.length; i++){
        let char = enc[i]
        if(!escaped){
            if(char==="^"){
                escaped = true
                continue
            }
            if(char==="|"){
                dec.push(str)
                str=""
                continue
            }
        }
        escaped = false
        str+=char
    }
    return dec
}
let encode = dec => dec.map(s=>s.toString().replace(/\^/g,"^^").replace(/\|/g,"^|")).join("|")+"|"

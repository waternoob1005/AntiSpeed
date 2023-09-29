import { events } from "bdsx/event"
import { MinecraftPacketIds } from "bdsx/bds/packetids"
import { ArmorSlot } from "bdsx/bds/inventory"
import { GameType } from "bdsx/bds/player"
import { bedrockServer } from "bdsx/launcher"
import { CANCEL } from "bdsx/common"

class AntiSpeed {
    static lastPOS : Record<string, number[]> = {}
    static lastBPS: Record<string, number> = {}
    static stacks: Record<string, number> = {}
    static playing: Record<string, boolean> = {}
}

events.playerJoin.on((ev) => {
    const pl = ev.player
    const plname = pl.getName()

    setTimeout(() => AntiSpeed.playing[plname] = true, 5000)
})

events.playerLeft.on((ev) => {
    const pl = ev.player
    const plname = pl.getName()

    AntiSpeed.playing[plname] = false
})

events.packetBefore(MinecraftPacketIds.PlayerAuthInput).on((pkt, ni) => {
    const pl = ni.getActor()!
    const plname = pl.getNameTag()
    const gamemode = pl.getGameType()
    const torso = pl.getArmor(ArmorSlot.Torso)
    const chestplate = torso.getRawNameId()

    if (AntiSpeed.playing[plname] !== true || pl.isRiding() || gamemode === GameType.Creative || gamemode === GameType.Spectator || chestplate === "minecraft:elytra") return
    if (!AntiSpeed.stacks[plname] || AntiSpeed.stacks[plname] < 0) AntiSpeed.stacks[plname] = 0

    try { AntiSpeed.lastPOS[plname][0] } catch { AntiSpeed.lastPOS[plname] = [pkt.pos.x, pkt.pos.z] }

    const dx = (pkt.pos.x - AntiSpeed.lastPOS[plname][0]) * 2
    const dz = (pkt.pos.z - AntiSpeed.lastPOS[plname][1]) * 2
    const BPS = Number(Math.sqrt(dx + dz).toFixed(2))

    if (BPS * 10 > 5 && BPS === AntiSpeed.lastBPS[plname]) AntiSpeed.stacks[plname]++

    if (AntiSpeed.stacks[plname] > 1) {
        bedrockServer.serverInstance.disconnectClient(ni, `Invalid movement detected\nPlease do not use hack clients\n\nmade by waternoob1005`)
        return CANCEL
    }

    setTimeout(() => AntiSpeed.stacks[plname]--, 10 * 1000)

    AntiSpeed.lastBPS[plname] = BPS
    AntiSpeed.lastPOS[plname] = [pkt.pos.x, pkt.pos.z]
})

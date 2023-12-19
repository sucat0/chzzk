import {DEFAULT_SEARCH_OPTIONS, SearchOptions} from "./options"
import {API_URL, GAME_API_URL} from "../consts"
import {Channel} from "./channel"
import {SearchResultVideo} from "./video"
import {Live} from "./live"
import {ChzzkClient} from "../client"

interface SearchResult {
    size: number
    nextOffset: number
}

export interface ChannelSearchResult extends SearchResult {
    channels: Channel[]
}

export interface VideoSearchResult extends SearchResult {
    videos: SearchResultVideo[]
}

export interface LiveSearchResult extends SearchResult {
    lives: Live[]
}

export class ChzzkSearch {
    private client: ChzzkClient

    constructor(client: ChzzkClient) {
        this.client = client
    }

    private async search(type: string, keyword: string, options: SearchOptions = DEFAULT_SEARCH_OPTIONS) {
        const params = new URLSearchParams({
            keyword,
            size: options.size.toString(),
            offset: options.offset.toString()
        }).toString()

        return this.client.fetch(`${API_URL}/service/v1/search/${type}?${params}`).then(r => r.json())
    }

    async videos(
        keyword: string,
        options: SearchOptions = DEFAULT_SEARCH_OPTIONS
    ): Promise<VideoSearchResult> {
        return this.search("videos", keyword, options).then(r => {
            const content = r['content']
            return {
                size: content['size'],
                nextOffset: content['page']['next']['offset'],
                videos: content['data'].map((data: Record<string, any>) => {
                    const video = data['video']
                    const channel = data['channel']

                    return {
                        ...video,
                        channel
                    }
                })
            }
        })
    }

    async lives(
        keyword: string,
        options: SearchOptions = DEFAULT_SEARCH_OPTIONS
    ): Promise<LiveSearchResult> {
        return this.search("lives", keyword, options).then(r => {
            const content = r['content']
            return {
                size: content['size'],
                nextOffset: content['page']['next']['offset'],
                lives: content['data'].map((data: Record<string, any>) => {
                    const live = data['live']
                    const channel = data['channel']

                    const livePlaybackJson = live['livePlaybackJson']
                    const livePlayback = livePlaybackJson ? JSON.parse(livePlaybackJson) : null

                    delete live['livePlaybackJson']

                    return {
                        ...live,
                        livePlayback,
                        channel
                    }
                })
            }
        })
    }

    async channels(
        keyword: string,
        options: SearchOptions = DEFAULT_SEARCH_OPTIONS
    ): Promise<ChannelSearchResult> {
        return this.search("channels", keyword, options).then(r => {
            const content = r['content']
            return {
                size: content['size'],
                nextOffset: content['page']['next']['offset'],
                channels: content['data'].map((data: Record<string, any>) => data['channel'])
            }
        })
    }

    async searchAutoComplete(
        keyword: string,
        options: SearchOptions = DEFAULT_SEARCH_OPTIONS
    ): Promise<string[]> {
        const params = new URLSearchParams({
            keyword,
            size: options.size.toString(),
            offset: options.offset.toString()
        }).toString()

        return this.client.fetch(`${GAME_API_URL}/v2/search/lounges/auto-complete?${params}`)
            .then(r => r.json())
            .then(data => data['content']['data'])
    }
}
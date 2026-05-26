export type Role = 'citizen' | 'admin' | 'field_worker'

export interface Profile {
    id:  string
    full_name: string
    role: Role
    crteated_at: string 
}

export interface Report {
    id: string
    citizen_id: string
    photo_url: string
    lat: number
    lng: number
    description: string
    status: 'reported' | 'assigned' | 'cleared'
    assigned_to: string | null
    created_at: string 

}
import { supabase } from './supabase';
import { AnchorPoint } from './types';

export interface ExportHistoryItem {
    id: string;
    user_id: string;
    created_at: string;
    image_name: string;
    export_language: string;
    exported_content: string;
    points_data: AnchorPoint[];
}

export async function saveExport(
    userId: string,
    imageName: string,
    language: string,
    content: string,
    points: ReadonlyArray<AnchorPoint>
) {
    if (!supabase) return;
    const { error } = await supabase.from('exports').insert({
        user_id: userId,
        image_name: imageName,
        export_language: language,
        exported_content: content,
        points_data: points
    });

    if (error) {
        console.error('Error saving export:', error.message);
        throw error;
    }
}

export async function getHistory(userId: string): Promise<ExportHistoryItem[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('exports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching history:', error.message);
        return [];
    }

    return data || [];
}

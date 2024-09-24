import { SessionContext } from 'src/bot/types/Scene';

export const getTelegramImage = async (ctx: SessionContext, tg_user_id: number) => {
  const photo_file_id = (await ctx.telegram.getUserProfilePhotos(tg_user_id, 0, 1)).photos?.[0]?.[2]
    .file_id;
  if (!photo_file_id) {
    return new URL('https://cdn-icons-png.flaticon.com/512/2830/2830524.png'); //`${process.env.MY_URL}/static/employee.jpeg`
  }
  const photo_url = await ctx.telegram.getFileLink(photo_file_id);

  return photo_url;
};

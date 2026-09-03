using System;
using System.Collections.Generic;
using System.Configuration;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;

public partial class admin_filemanager_upload : ez.function
{
    //限制寬度尺寸不得超過1024
    const double maxSize = 1024;


    protected void Page_Load(object sender, EventArgs e)
    {
        ez.admin.user chkuser = new ez.admin.user();
        if (chkuser.isLogin())
        {
            try
            {
                ez.fileSystem fileSystem = new ez.fileSystem(false);

                string up_path = Server.MapPath("~/upload/edit/");
                DirectoryInfo DirectoryInfo = new DirectoryInfo(up_path);
                if (!DirectoryInfo.Exists)
                {
                    DirectoryInfo.Create();    //在本機上建資料夾                 
                }

                for (int i = 0; i < Request.Files.Count; i++)
                {
                    HttpPostedFile jpeg_image_upload = Request.Files[i];

                    string[] n = jpeg_image_upload.FileName.Split('.');
                    //string newName = Now().ToString("yyyyMMddHHmmssfff") + "." + n[n.Length - 1];
                    string newName = jpeg_image_upload.FileName;
                    string savePath = up_path + (up_path.Substring(up_path.Length - 1, 1) != "/" ? "/" : "") + newName;

                    if (fileSystem.isPhoto(jpeg_image_upload.FileName))
                    {

                        //if (AutoConvertJPG())
                        //{
                        //    newName = newName.ToLower().Replace(".bmp", ".jpg");
                        //    newName = newName.ToLower().Replace(".png", ".jpg");
                        //    savePath = savePath.ToLower().Replace(".bmp", ".jpg");
                        //    savePath = savePath.ToLower().Replace(".png", ".jpg");
                        //}

                        n = savePath.Split('.');

                        System.Drawing.Image Bm = new System.Drawing.Bitmap(jpeg_image_upload.InputStream);

                        foreach (PropertyItem pi in Bm.PropertyItems)
                        {
                            // orientation tag id is 274                        
                            if (pi.Id == 274)
                            {
                                switch (pi.Value[0])
                                {
                                    case 2:
                                        Bm.RotateFlip(RotateFlipType.RotateNoneFlipX);
                                        break;
                                    case 3:
                                        Bm.RotateFlip(RotateFlipType.Rotate180FlipNone);
                                        break;
                                    case 4:
                                        Bm.RotateFlip(RotateFlipType.RotateNoneFlipY);
                                        break;
                                    case 5:
                                        Bm.RotateFlip(RotateFlipType.Rotate90FlipX);
                                        break;
                                    case 6:
                                        Bm.RotateFlip(RotateFlipType.Rotate90FlipNone);
                                        break;
                                    case 7:
                                        Bm.RotateFlip(RotateFlipType.Rotate270FlipX);
                                        break;
                                    case 8:
                                        Bm.RotateFlip(RotateFlipType.Rotate270FlipNone);
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }

                        double newWidth = Bm.Width;
                        double newHeight = Bm.Height;
                        if (Bm.Width >= maxSize)
                        {
                            newWidth = maxSize;
                            newHeight = maxSize / Bm.Width;
                            newHeight = newHeight * Bm.Height;
                        }
                        /*if (Bm.Width > Bm.Height)
                         {
                             if (Bm.Width > maxSize)
                             {
                                 newWidth = maxSize;
                                 newHeight = maxSize / Bm.Width;
                                 newHeight = newHeight * Bm.Height;
                             }
                         }
                         else
                         {
                             if (Bm.Height > maxSize)
                             {
                                 newHeight = maxSize;                        
                                 newWidth =  maxSize / Bm.Height;
                                 newWidth = newWidth * Bm.Width;
                             }
                         }*/

                        string picType = n[n.Length - 1].ToLower();
                        if (picType == "jpg") { picType = "jpeg"; }
                        System.Drawing.Image New_Image = new Bitmap((int)newWidth, (int)newHeight);
                        Graphics ObjGraphics = Graphics.FromImage(New_Image);

                        ObjGraphics.InterpolationMode = GetInterpolationMode();
                        ObjGraphics.SmoothingMode = GetSmoothingMode();
                        ObjGraphics.CompositingQuality = GetCompositingQuality();

                        if (picType == "png")
                        {
                            ObjGraphics.Clear(Color.Transparent);    //清空Graphics, 以透明色填充
                        }
                        else
                        {
                            ObjGraphics.Clear(Color.White);         //清空Graphics, 以白色填充
                        }

                        //在指定位置按指定大小繪制原圖片的片段
                        ObjGraphics.DrawImage(Bm, new Rectangle(0, 0, (int)newWidth, (int)newHeight), new Rectangle(0, 0, Bm.Width, Bm.Height), GraphicsUnit.Pixel);

                        //下方設定使JPG質量
                        EncoderParameters EPS = new EncoderParameters();
                        EncoderParameter EP = new EncoderParameter(Encoder.Quality, GetPicQuality());
                        EPS.Param[0] = EP;
                        ImageCodecInfo[] codecs = ImageCodecInfo.GetImageEncoders();
                        ImageCodecInfo ICI = null;
                        foreach (ImageCodecInfo codec in codecs)
                        {
                            if (codec.MimeType == "image/" + picType)
                            {
                                ICI = codec;
                                break;
                            }
                        }
                        New_Image.Save(savePath, ICI, EPS);
                        New_Image.Dispose();
                        ObjGraphics.Dispose();

                        Bm.Dispose();

                    }
                    else if (fileSystem.isAllowed(jpeg_image_upload.FileName))
                    {
                        jpeg_image_upload.SaveAs(savePath);
                    }
                }
            }
            catch (Exception)
            {
                // If any kind of error occurs return a 500 Internal Server error
                //Response.StatusCode = 500;
                //Response.Write("An error occured");
                Response.End();
            }
            finally
            {
                Response.End();
            }
        }
        else
        {
            Response.Clear();
            Response.StatusCode = 404;
            Response.End();
        }

    }
}
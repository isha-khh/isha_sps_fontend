<%@ WebHandler Language="C#" Class="DisplayCut2" %>

using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Web;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Net;

public class DisplayCut2 : IHttpHandler
{

    public void ProcessRequest(HttpContext context)
    {
        if (context.Request.QueryString["W"] != null & context.Request.QueryString["H"] != null)
        {
            string CurrentPath = HttpContext.Current.Server.MapPath("~/upload/");

            ez.function ezfun = new ez.function();
            if (!ezfun.isStrNull(HttpContext.Current.Request["rootDir"]))
            {
                string rootDir = HttpContext.Current.Request["rootDir"].ToString().Replace("../","");
                if (rootDir.Substring(0, 1) == "/") { rootDir = rootDir.Substring(1, rootDir.Length - 1); }
                if (rootDir.Substring(rootDir.Length - 1, 1) != "/") { rootDir = rootDir + "/"; }
                CurrentPath = HttpContext.Current.Server.MapPath("~/" + rootDir);
            }

            string FileName = HttpUtility.UrlDecode(context.Request.QueryString["File"].Trim().Replace("../",""));
            int GetWidth = Convert.ToInt32(context.Request.QueryString["W"].Trim());
            int GetHeight = Convert.ToInt32(context.Request.QueryString["H"].Trim());

            ez.fileSystem fs = new ez.fileSystem();
            System.Drawing.Image Original_Image;

            string FileNameAndPath = "";
            string picType = "";
            if (FileName.IndexOf("http://") > -1 || FileName.IndexOf("https://") > -1)
            {
                picType = "jpeg";
                FileNameAndPath = FileName;

                WebClient wc = new WebClient();
                byte[] bytes = wc.DownloadData(FileNameAndPath);
                MemoryStream ms = new MemoryStream(bytes);
                Original_Image = System.Drawing.Image.FromStream(ms);
            }
            else
            {
                string[] n = Path.GetFileName(FileName).Split('.');
                picType = n[n.Length - 1].ToLower();
                if (picType == "jpg")
                    picType = "jpeg";

                if (picType == "png")
                    picType = "jpeg";

                FileNameAndPath = CurrentPath + FileName;

                if (!System.IO.File.Exists(FileNameAndPath) | !fs.isPhoto(FileName))
                {
                    FileNameAndPath = HttpContext.Current.Server.MapPath("~/App_Script/noimage_us.jpg");
                    //顯示無圖片
                    picType = "jpeg";
                }

                Original_Image = System.Drawing.Image.FromFile(FileNameAndPath);
            }               

            context.Response.ContentType = "Image/" + picType.ToUpper();
            context.Response.Clear();


            int New_Width = Convert.ToInt32(context.Request.QueryString["W"].Trim());
            int New_Height = Convert.ToInt32(context.Request.QueryString["H"].Trim());

            int x = 0;
            int y = 0;

            int old_h = Original_Image.Height;
            int old_w = Original_Image.Width;

            if (old_w < old_h)
            {
                if (New_Width < old_w)
                {
                    double value = old_h * (Convert.ToDouble(New_Width) / Convert.ToDouble(old_w));
                    New_Height = Convert.ToInt32(Math.Round(value, 0, MidpointRounding.AwayFromZero));
                }
                else
                {
                    New_Width = old_w;
                    New_Height = old_h;
                }
            }
            else
            {
                if (New_Height < old_h)
                {
                    double value = old_w * (Convert.ToDouble(New_Height) / Convert.ToDouble(old_h));
                    New_Width = Convert.ToInt32(Math.Round(value, 0, MidpointRounding.AwayFromZero));
                }
                else
                {
                    New_Width = old_w;
                    New_Height = old_h;
                }
            }
            

            System.Drawing.Image New_Image = new System.Drawing.Bitmap(GetWidth, GetHeight);
            System.Drawing.Graphics ObjGraphics = System.Drawing.Graphics.FromImage(New_Image);

            ez.function f = new ez.function();
            
            //相關設定
            ObjGraphics.InterpolationMode = f.GetInterpolationMode();
            ObjGraphics.SmoothingMode = f.GetSmoothingMode();
            ObjGraphics.CompositingQuality = f.GetCompositingQuality();

            if (picType == "png")
            {
                ObjGraphics.Clear(System.Drawing.Color.Transparent);
                //清空Graphics, 以透明背景色填充
            }
            else
            {
                ObjGraphics.Clear(System.Drawing.Color.White);
                //清空Graphics, 以白色填充
            }

            //在指定位置按指定大小繪制原圖片的片段
            ObjGraphics.DrawImage(Original_Image, new System.Drawing.Rectangle((GetWidth - New_Width) / 2, (GetHeight - New_Height) / 2, New_Width, New_Height), new System.Drawing.Rectangle(x, y, Original_Image.Width, Original_Image.Height), System.Drawing.GraphicsUnit.Pixel);


            //下方設定使JPG質量          
            System.Drawing.Imaging.EncoderParameters EPS = new System.Drawing.Imaging.EncoderParameters();
            System.Drawing.Imaging.EncoderParameter EP = new System.Drawing.Imaging.EncoderParameter(System.Drawing.Imaging.Encoder.Quality, Convert.ToInt64(f.GetPicQuality()));


            EPS.Param[0] = EP;

            System.Drawing.Imaging.ImageCodecInfo[] codecs = System.Drawing.Imaging.ImageCodecInfo.GetImageEncoders();

            System.Drawing.Imaging.ImageCodecInfo ICI = null;


            foreach (System.Drawing.Imaging.ImageCodecInfo codec in codecs)
            {
                if (codec.MimeType.ToLower() == ("image/" + picType).ToLower())
                {
                    ICI = codec;
                }
            }

            New_Image.Save(context.Response.OutputStream, ICI, EPS);


            //Clear
            New_Image.Dispose();
            ObjGraphics.Dispose();
            Original_Image.Dispose();

        }
    }

    public bool IsReusable
    {
        get { return false; }
    }

}

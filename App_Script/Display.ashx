<%@ WebHandler Language="C#" Class="ShowPic" %>

using System;
using System.Web;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;

public class ShowPic : IHttpHandler 
{

	//Path Area
	protected static String MyPathIsVirtual = System.Web.Configuration.WebConfigurationManager.AppSettings["VirtualPath"];
	protected static String MyPathIsUploadBase = MyPathIsVirtual + System.Web.Configuration.WebConfigurationManager.AppSettings["PathIsUploadBase"];
    //protected static String CurrentPath = HttpContext.Current.Server.MapPath("./upload/product/");

	public void ProcessRequest(HttpContext context)
	{
		if (context.Request.QueryString["File"] != null && context.Request.QueryString["W"] != null && context.Request.QueryString["H"] != null)
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
            
            
			String FileName = HttpUtility.UrlDecode(context.Request.QueryString["File"].Trim().Replace("../",""));
			int GetWidth = int.Parse(context.Request.QueryString["W"].Trim());
			int GetHeight = int.Parse(context.Request.QueryString["H"].Trim());

			context.Response.ContentType = "Image/JPEG";
			context.Response.Clear();
			//context.Response.BufferOutput = true; //緩衝輸出, 處理完再送出

			String FileNameAndPath = CurrentPath + FileName;

			if (!System.IO.File.Exists(FileNameAndPath))
			{
				//File.WriteAllText( "C:\\log.txt" , "取得路徑為 " + FileNameAndPath + " 找不到檔案.");
			}


			//開始處理
			System.IO.FileInfo Original_FileInfo = new System.IO.FileInfo(FileNameAndPath);
			System.Drawing.Image Original_Image = System.Drawing.Image.FromFile(FileNameAndPath); //讀取圖片

			int New_Width = int.Parse(context.Request.QueryString["W"].Trim());
			int New_Height = int.Parse(context.Request.QueryString["H"].Trim());

			int x = 0;
			int y = 0;

			#region 產生圖形計算公式
			switch (context.Request.QueryString["Type"])
			{
                case "morph":   //強制寬高變形
                    New_Width = int.Parse(context.Request.QueryString["W"].Trim());
			        New_Height = int.Parse(context.Request.QueryString["H"].Trim());
                    break;
                    
				case "Default":   //等比縮放
				
				default: //預設依 Width 等比縮放, 不論Height
					New_Height = Original_Image.Height * GetWidth / Original_Image.Width;
                    if (New_Height > int.Parse(context.Request.QueryString["H"].Trim())) {
                        New_Height = int.Parse(context.Request.QueryString["H"].Trim());
                        New_Width = Original_Image.Width  * GetHeight / Original_Image.Height;
                    }
				break;
			}
			
			#endregion

			//開空白畫布
			System.Drawing.Image New_Image = new System.Drawing.Bitmap(New_Width, New_Height);
			System.Drawing.Graphics ObjGraphics = System.Drawing.Graphics.FromImage(New_Image);

			#region 圖片設定
            ez.function f = new ez.function();
            
			//相關設定
            ObjGraphics.InterpolationMode = f.GetInterpolationMode();
            ObjGraphics.SmoothingMode = f.GetSmoothingMode();
            ObjGraphics.CompositingQuality = f.GetCompositingQuality();

			ObjGraphics.Clear(System.Drawing.Color.Transparent);	//清空Graphics, 以透明背景色填充

			//在指定位置按指定大小繪制原圖片的片段
			ObjGraphics.DrawImage(Original_Image,
				new System.Drawing.Rectangle(0, 0, New_Width, New_Height),
				new System.Drawing.Rectangle(x, y, Original_Image.Width, Original_Image.Height),
				System.Drawing.GraphicsUnit.Pixel);


			//下方設定使JPG質量         
			System.Drawing.Imaging.EncoderParameters EPS = new System.Drawing.Imaging.EncoderParameters();
            System.Drawing.Imaging.EncoderParameter EP = new System.Drawing.Imaging.EncoderParameter(System.Drawing.Imaging.Encoder.Quality, (long)f.GetPicQuality());

			EPS.Param[0] = EP;


			System.Drawing.Imaging.ImageCodecInfo[] codecs = System.Drawing.Imaging.ImageCodecInfo.GetImageEncoders();
			System.Drawing.Imaging.ImageCodecInfo ICI = null;

			foreach (System.Drawing.Imaging.ImageCodecInfo codec in codecs)
			{
				if (codec.MimeType == "image/jpeg") ICI = codec;
			}
			#endregion


			New_Image.Save(context.Response.OutputStream , ICI, EPS);

			//Clear
			New_Image.Dispose();
			ObjGraphics.Dispose();
			Original_Image.Dispose();


		}
	}
	
 
    public bool IsReusable
	{
        get
		{
            return false;
        }
    }

}
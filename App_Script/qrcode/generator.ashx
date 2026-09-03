<%@ WebHandler Language="C#" Class="generator" %>

using System;
using System.Web;
using Gma.QrCodeNet.Encoding;
using Gma.QrCodeNet.Encoding.Windows.Render;
using System.Drawing;

public class generator : IHttpHandler {

    public void ProcessRequest (HttpContext context) {

        context.Response.ContentType = "text/plain";

        ez.function f = new ez.function();
        if (!f.isStrNull(context.Request.QueryString["val"]))
        {
            string picType = "Image/jpeg";
            context.Response.ContentType = picType;
            context.Response.Clear();

            /*
              Level L (Low)      7%  of codewords can be restored. 
              Level M (Medium)   15% of codewords can be restored. 
              Level Q (Quartile) 25% of codewords can be restored. 
              Level H (High)     30% of codewords can be restored. 
            */
            QrEncoder encoder = new QrEncoder(ErrorCorrectionLevel.L);   //設定錯誤修正容量(請參考上面註解)
            string codeString = context.Request.QueryString["val"];
            QrCode code = encoder.Encode(codeString);
            int moduleSizeInPixels = 12;  //定義線條寬度
            GraphicsRenderer renderer = new GraphicsRenderer(new FixedModuleSize(moduleSizeInPixels, QuietZoneModules.Two), Brushes.Black, Brushes.White);
            //留白區大小
            Point padding = new Point(10, 16);

            //取得條碼圖大小
            DrawingSize dSize = renderer.SizeCalculator.GetSize(code.Matrix.Width);
            int imgWidth = dSize.CodeWidth + 2 * padding.X;
            int imgHeight = dSize.CodeWidth+2 * padding.Y;
            //設定影像大小
            Image img = new Bitmap(imgWidth, imgHeight);

            //繪製二維條碼圖
            Graphics g = Graphics.FromImage(img);
            renderer.Draw(g, code.Matrix, padding);

            //下方設定使JPG質量         
            System.Drawing.Imaging.EncoderParameters EPS = new System.Drawing.Imaging.EncoderParameters();
            System.Drawing.Imaging.EncoderParameter EP = new System.Drawing.Imaging.EncoderParameter(System.Drawing.Imaging.Encoder.Quality, Convert.ToInt64(f.GetPicQuality()));
                
            EPS.Param[0] = EP;
            System.Drawing.Imaging.ImageCodecInfo[] codecs = System.Drawing.Imaging.ImageCodecInfo.GetImageEncoders();
            System.Drawing.Imaging.ImageCodecInfo ICI = null;

            foreach (System.Drawing.Imaging.ImageCodecInfo codec in codecs)  
                if (codec.MimeType.ToLower() ==picType.ToLower())        
                    ICI = codec;      

            img.Save(context.Response.OutputStream, ICI, EPS);
            img.Dispose();
            g.Dispose();
        }

    }

    public bool IsReusable {
        get {
            return false;
        }
    }

}
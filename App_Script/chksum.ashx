<%@ WebHandler Language="C#" Class="chksum" %>

using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Web;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Web.SessionState;

public class chksum : IHttpHandler, IRequiresSessionState
{


    public void ProcessRequest(HttpContext context)
    {
        string sCode = string.Empty;
        //清除該頁輸出緩存，設置該頁無緩存   
        context.Response.Buffer = true;
        context.Response.ExpiresAbsolute = System.DateTime.Now.AddMilliseconds(0);
        context.Response.Expires = 0;
        context.Response.CacheControl = "no-cache";
        context.Response.AppendHeader("Pragma", "No-Cache");
        //將驗證碼圖片寫入記憶體流，並將其以 "image/Png" 格式輸出   
        MemoryStream oStream = new MemoryStream();

        try
        {

            ez.function f = new ez.function();
            //Randomize()
            //Dim clen As New Random
            CreateValidateCodeImage(ref oStream, ref sCode, 4, 100, 40, 18);
            //Response.Cookies("chknum").Value = sCode
            //Response.Cookies("chknum").Expires = DateAdd("D", 1, Today)
            string chknum = "chknum";
            if (context.Request["key"] != null)
            {
                chknum = context.Request["key"];
            }
            context.Session[f.SC + "_" + chknum] = sCode;
            context.Response.ClearContent();
            context.Response.ContentType = "image/Png";
            context.Response.BinaryWrite(oStream.ToArray());
        }
        finally
        {
            //釋放資源   
            oStream.Dispose();
        }
    }

    /// <summary>   
    /// 產生圖形驗證碼。   
    /// </summary>   
    public Bitmap CreateValidateCodeImage(ref string Code, int CodeLength, int Width, int Height, int FontSize)
    {
        string sCode = string.Empty;
        //顏色列表，用於驗證碼、噪線、噪點   
        Color[] oColors = {
			System.Drawing.Color.Black,
			System.Drawing.Color.Red,
			System.Drawing.Color.Blue,
			System.Drawing.Color.Green,
			System.Drawing.Color.Orange,
			System.Drawing.Color.Brown,
			System.Drawing.Color.Brown,
			System.Drawing.Color.DarkBlue
		};
        //字體列表，用於驗證碼   
        string[] oFontNames = {
			"Times New Roman",
			"MS Mincho",
			"Book Antiqua",
			"Gungsuh",
			"PMingLiU",
			"Impact"
		};
        //驗證碼的字元集，去掉了一些容易混淆的字元   
        char[] oCharacter = {
			'2',
			'3',
			'4',
			'5',
			'6',
			'8',
			'9',
			'A',
			'B',
			'C',
			'D',
			'E',
			'F',
			'G',
			'H',
			'J',
			'K',
			'L',
			'M',
			'N',
			'P',
			'R',
			'S',
			'T',
			'W',
			'X',
			'Y'
		};
        Random oRnd = new Random(Guid.NewGuid().GetHashCode());
        Bitmap oBmp = null;
        Graphics oGraphics = null;
        int N1 = 0;
        System.Drawing.Point oPoint1 = default(System.Drawing.Point);
        System.Drawing.Point oPoint2 = default(System.Drawing.Point);
        string sFontName = null;
        Font oFont = null;
        Color oColor = default(Color);

        //生成驗證碼字串   
        for (N1 = 0; N1 < CodeLength ; N1++)
        {
            sCode += oCharacter[oRnd.Next(oCharacter.Length)];
        }

        oBmp = new Bitmap(Width, Height);
        oGraphics = Graphics.FromImage(oBmp);
        oGraphics.Clear(System.Drawing.Color.White);
        try
        {
            for (N1 = 0; N1 <= 2; N1++)
            {
                //畫噪線   
                oPoint1.X = oRnd.Next(Width);
                oPoint1.Y = oRnd.Next(Height);
                oPoint2.X = oRnd.Next(Width);
                oPoint2.Y = oRnd.Next(Height);
                oColor = oColors[oRnd.Next(oColors.Length)];
                oGraphics.DrawLine(new Pen(oColor), oPoint1, oPoint2);
            }

            for (N1 = 0; N1 <= sCode.Length - 1; N1++)
            {
                //畫驗證碼字串   
                sFontName = oFontNames[oRnd.Next(oFontNames.Length)];
                oFont = new Font(sFontName, FontSize, FontStyle.Italic);
                oColor = oColors[oRnd.Next(oColors.Length)];
                oGraphics.DrawString(sCode[N1].ToString(), oFont, new SolidBrush(oColor), Convert.ToSingle(N1) * FontSize + 10, Convert.ToSingle(8));
            }

            for (int i = 0; i <= 50; i++)
            {
                //畫噪點   
                int x = oRnd.Next(oBmp.Width);
                int y = oRnd.Next(oBmp.Height);
                Color clr = oColors[oRnd.Next(oColors.Length)];
                oBmp.SetPixel(x, y, clr);
            }

            Code = sCode;
            return oBmp;
        }
        finally
        {
            oGraphics.Dispose();
        }
    }

    /// <summary>   
    /// 產生圖形驗證碼。   
    /// </summary>   
    public void CreateValidateCodeImage(ref MemoryStream MemoryStream, ref string Code, int CodeLength, int Width, int Height, int FontSize)
    {
        Bitmap oBmp = null;

        oBmp = CreateValidateCodeImage(ref Code, CodeLength, Width, Height, FontSize);
        try
        {
            oBmp.Save(MemoryStream, ImageFormat.Png);
        }
        finally
        {
            oBmp.Dispose();
        }
    }


    public bool IsReusable
    {
        get { return false; }
    }

}

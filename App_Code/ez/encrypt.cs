///1.19.0807@加解密函式模組

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.Security;


/// <summary>
/// encrypt 的摘要描述
/// </summary>

namespace ez
{
    public class encrypt
    {
        public encrypt()
        {
            //
            // TODO: 在這裡新增建構函式邏輯
            //
        }


        public string MD5(string str)
        {
            return FormsAuthentication.HashPasswordForStoringInConfigFile(str, "MD5").ToLower();
        }

        public static string Base64Encode(string AStr)
        {
            try
            {
                return Convert.ToBase64String(Encoding.UTF8.GetBytes(AStr));
            }
            catch (Exception ex)
            {
                return AStr;
            }

        }

        public static string Base64Decode(string ABase64)
        {
            try
            {
                return Encoding.UTF8.GetString(Convert.FromBase64String(ABase64));
            }
            catch (Exception ex)
            {
                return ABase64;
            }

        }


        public string SHA1(string SourceStr)    //SHA1加密
        {
            return FormsAuthentication.HashPasswordForStoringInConfigFile(SourceStr, "SHA1");
        }

        private byte[] Keys = { 0xEF, 0xAB, 0x56, 0x78, 0x90, 0x34, 0xCD, 0x12 };

        public string EncryptDes(string SourceStr, string skey)       //使用標準DES對稱加密, skey請帶入8位數自訂KEY
        {
            try
            {
                byte[] rgbKey = Encoding.UTF8.GetBytes(skey.Substring(0, 8));
                byte[] rgbIV = Keys;
                byte[] inputByteArray = Encoding.UTF8.GetBytes(SourceStr);
                DESCryptoServiceProvider dCSP = new DESCryptoServiceProvider();
                MemoryStream mStream = new MemoryStream();
                CryptoStream cStream = new CryptoStream(mStream, dCSP.CreateEncryptor(rgbKey, rgbIV), CryptoStreamMode.Write);
                cStream.Write(inputByteArray, 0, inputByteArray.Length);
                cStream.FlushFinalBlock();
                string str = Convert.ToBase64String(mStream.ToArray());
                return str;
            }
            catch
            {
                return SourceStr;
            }
        }

        public string DecryptDes(string SourceStr, string skey)       //使用標準DES對稱解密, skey請帶入8位數自訂KEY
        {
            try
            {
                byte[] rgbKey = Encoding.UTF8.GetBytes(skey.Substring(0, 8));
                byte[] rgbIV = Keys;
                byte[] inputByteArray = Convert.FromBase64String(SourceStr);
                DESCryptoServiceProvider DCSP = new DESCryptoServiceProvider();
                MemoryStream mStream = new MemoryStream();
                CryptoStream cStream = new CryptoStream(mStream, DCSP.CreateDecryptor(rgbKey, rgbIV), CryptoStreamMode.Write);
                cStream.Write(inputByteArray, 0, inputByteArray.Length);
                cStream.FlushFinalBlock();
                return Encoding.UTF8.GetString(mStream.ToArray());
            }
            catch
            {
                return SourceStr;
            }
        }

        public string EncryptAutoKey(string str)
        {
            function f = new function();
            if (!f.isStrNull(str))
            {
                string key = randKey(8);
                string encode = EncryptDes(str, key);
                str = randKey(3) + f.Left(key, 5) + f.Left(encode, encode.Length - 2) + f.Right(key, 3) + f.Right(encode, 2);
                return str;
            }
            return "";
        }
        public string DecryptAutoKey(string str)
        {
            try
            {
                function f = new function();
                string str2 = str.Substring(3, str.Length - 3);
                string key = f.Left(str2, 5) + f.Left(f.Right(str2, 5), 3);
                str2 = str2.Substring(5, str2.Length - 10) + f.Right(str2, 2);
                return DecryptDes(str2, key);
            }
            catch (Exception ex)
            {

            }
            return str;
        }


        public string SHA256(string str)
        {
            using (SHA256 hash = SHA256Managed.Create())
            {
                return string.Concat(hash
                  .ComputeHash(Encoding.UTF8.GetBytes(str))
                  .Select(item => item.ToString("x2")));
            }
        }

        public string randKey(int count)
        {
            //產生驗證碼		
            Random rnd = new Random(Guid.NewGuid().GetHashCode());
            string[] code = {
                 "0","1","2","3","4","5","6","7","8","9",
                "a","b","c","d","e","f","g","h","i", "j","k","l","m", "n", "o","p","q","r","s","t","u","v","w","x","y","z",
                "A","B","B","D","E","F","G","H","I", "J","K","L","M", "N", "O","P","Q","R","S","T","U","V","W","X","Y","Z",
                "+","/"
            };
            string rnd_code = null;
            //產生10碼
            for (int i = 1; i <= count; i++)
                rnd_code += "" + code[rnd.Next(0, code.Length - 1)];

            return rnd_code;
        }

    }
}

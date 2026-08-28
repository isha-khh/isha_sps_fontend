<%@ Control Language="C#" AutoEventWireup="true" CodeFile="recaptcha.ascx.cs" Inherits="admin_uc_config_recaptcha" %>

<div class="col-sm-10">     
     <p class="form-control-static">         
         請至Google reCAPTCHA <a href="https://www.google.com/recaptcha/" target="_blank">建立取得</a>
         <br>
         申請類型：reCAPTCHA v2 「我不是機器人」核取方塊
         </p> 

         <p class="form-control-static">   
                       網站金鑰：
                    <input type="text" class="form-control" id="Sitekey" runat="server" />
         </p>
         <p class="form-control-static">   
                        網站密鑰：
                    <input type="text" class="form-control" id="Secret" runat="server" />
       </p>
                      
     </div>